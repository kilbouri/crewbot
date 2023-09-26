import {Game} from "./database";
import {GuildMember} from "discord.js";
import {DiscordUtil} from "./discordUtil";
import {ControlPanelManager} from "./controlPanelManager";
import {Lazy} from "./lazy";
import {VoiceManager} from "./voiceManager";

// TODO: cache instances so we don't have to work so hard to create em

/**
 * Provides logic related to the lifecycle of an Among Us game.
 */
export class GameCoordinator {
    private controlPanel: Lazy<ControlPanelManager>;
    private voiceManager: Lazy<VoiceManager>;

    private constructor(private game: Game) {
        this.controlPanel = new Lazy(async () => await ControlPanelManager.forGame(this.game));
        this.voiceManager = new Lazy(async () => await VoiceManager.forGame(this.game));
    }

    /**
     * Creates a GameCoordinator for an *existing* Game in the specified channel.
     *
     * @param voiceChannelId the id of the voice channel in which the game is occuring
     * @returns A GameCoordinator the the game in the specified
     *          voice channel, or undefined if no game is taking place
     */
    static async forChannel(voiceChannelId: string): Promise<GameCoordinator | undefined> {
        const dbEntry = await Game.findOne({where: {channelId: voiceChannelId}});

        if (!dbEntry) {
            // we can't construct a coordinator for a
            // channel that does not have a game in it
            return undefined;
        }

        return new this(dbEntry);
    }

    /**
     * Creates a Game in the specified channel with the specified control panel channel and message,
     * and provides a GameCoordinator for that game.
     * @param voiceChannelId the id of the voice channel in which the game will take place
     * @param controlPanel the channel and message ids, needed to fetch the control panel in the future
     * @returns a GameCoordinator for the newly created game.
     */
    static async createGame(
        voiceChannelId: string,
        controlPanel: {channelId: string; messageId: string}
    ): Promise<GameCoordinator> {
        const vc = await DiscordUtil.getChannel(voiceChannelId, true);
        if (!vc || !vc.isVoiceBased()) {
            throw "Invalid voice channel id";
        }

        const memberIds = vc.members.map((member) => member.id);

        // players in VC start as spectators, will be moved
        // to alive when the game starts
        const createdGame = await Game.create({
            guildId: vc.guildId,
            channelId: voiceChannelId,
            controlPanelChannelId: controlPanel.channelId,
            controlPanelMessageId: controlPanel.messageId,
            alivePlayerIds: new Array<string>(0),
            deadPlayerIds: new Array<string>(0),
            spectatingPlayerIds: memberIds,
            state: "created",
        });

        // Having this here plus a lazy instance created in the constructor is a bit gross,
        // but realistically OK. This will prime the cache for the lazy instance anyway,
        // so we shouldn't be hitting the API twice.
        const tempControlPanelManager = await ControlPanelManager.forGame(createdGame);
        tempControlPanelManager.update();

        return new this(createdGame);
    }

    /**
     * Provides a mechanism to change the message that is being used as a control panel. The main use-case
     * of this function is to update the message id when an edit changes the id, rather than to change it to
     * a completely different message (though it is possible).
     *
     * @param channelId the new channel id of the control panel
     * @param messageId the new message id of the control panel
     */
    async setControlPanel(channelId: string, messageId: string) {
        await this.game.update({controlPanelChannelId: channelId, controlPanelMessageId: messageId});
    }

    /**
     * Starts a game. Staring is defined as moving from the "Created" phase to the
     * "Playing" phase. This is the bot's version of pressing the Play button in game.
     */
    async startGame() {
        await this.game.reload();

        // All spectators become alive, and the spectator/dead sets are empty.
        // Setting the dead set to empty is likely redundant but worth doing
        // since we're updating anyway.
        const alivePlayerIds = this.game.spectatingPlayerIds;
        const deadPlayerIds = new Array<string>(0);
        const spectatingPlayerIds = new Array<string>(0);

        await this.game.update({state: "playing", alivePlayerIds, spectatingPlayerIds, deadPlayerIds});
        await Promise.all([this.ensureVoiceState(), this.updateControlPanel()]);
    }

    /**
     * Starts a meeting. As the name implies, the corresponding action in-game is
     * an emergency meeting being called, or a body being reported.
     */
    async startMeeting() {
        await this.game.update({state: "meeting"});
        await Promise.all([this.ensureVoiceState(), this.updateControlPanel()]);
    }

    /**
     * Ends a meeting. As the name implies, the corresponding action in-game is
     * a meeting ending after the crew has voted.
     */
    async endMeeting() {
        await this.game.update({state: "playing"});
        await Promise.all([this.ensureVoiceState(), this.updateControlPanel()]);
    }

    /**
     * Ends a game. The corresponding actions in-game include:
     * - the crewmates voting out all impostors
     * - the crewmates winning on tasks
     * - the impostor(s) killing enough crew
     * - the impostor(s) winning by sabotage
     */
    async endGame() {
        await this.game.update({state: "ended"});
        await Promise.all([this.ensureVoiceState(), this.updateControlPanel()]);

        await this.game.destroy();
    }

    /**
     * Informs the coordinator that a player has joined the voice channel in which the game is taking place
     * @param guildMember the GuildMember which joined the voice channel the game is taking place in
     */
    async playerJoined(guildMember: GuildMember) {
        await this.game.reload();

        const guildMemberId = guildMember.id;
        const playerSets = [this.game.alivePlayerIds, this.game.deadPlayerIds, this.game.spectatingPlayerIds];

        // first time joining, they are a spectator
        if (!playerSets.some((set) => set.includes(guildMemberId))) {
            const newSpectators = [...this.game.spectatingPlayerIds, guildMemberId];
            await this.game.update({spectatingPlayerIds: newSpectators});
            await this.updateControlPanel();
        }

        await this.ensureGuildMemberVoiceState(guildMemberId);
    }

    /**
     * Informs the coordinator that a player has left the voice channel in which the game is taking place
     * @param guildMember the GuildMember which left the voice channel the game is taking place in
     */
    async playerLeft(guildMember: GuildMember) {
        // todo: should we hide players who are no longer in the VC? On the upside, this makes the control panel more accurate.
        // On the downside, this is more costly and increases the state we need to keep.

        await guildMember.edit({deaf: false, mute: false});
    }

    /**
     * Marks a player as dead.
     * @param playerId the user id of the player that died
     */
    async playerDied(playerId: string) {
        await this.game.reload();

        if (!this.game.alivePlayerIds.includes(playerId)) {
            throw "playerDied called with non-alive player id";
        }

        const newAlive = this.game.alivePlayerIds.filter((id) => id !== playerId);
        const newDead = [...this.game.deadPlayerIds, playerId];

        await this.game.update({alivePlayerIds: newAlive, deadPlayerIds: newDead});
        await Promise.all([this.ensureGuildMemberVoiceState(playerId), this.updateControlPanel()]);
    }

    /**
     * Returns the list of unqiue user ids for players that are currently alive.
     * @returns an array of user ids that are currently alive
     */
    async getAlivePlayers(): Promise<string[]> {
        await this.game.reload();

        // clone the array to protect the internal array
        return [...this.game.alivePlayerIds];
    }

    /**
     * Triggers a control panel update. Only useful to update the control panel
     * after initial game creation. All other methods call this for you, if needed.
     */
    private async updateControlPanel() {
        const controlPanel = await this.controlPanel.get();
        await controlPanel.update();
    }

    private async ensureVoiceState() {
        const voiceManager = await this.voiceManager.get();
        await voiceManager.ensureVoiceState();
    }

    private async ensureGuildMemberVoiceState(playerId: string) {
        const voiceManager = await this.voiceManager.get();
        await voiceManager.ensureGuildMemberVoiceState(playerId);
    }
}

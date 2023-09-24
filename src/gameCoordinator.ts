import {Game} from "./database";
import {APIEmbed, EmbedBuilder, Guild, GuildMember, TextBasedChannel, channelMention, userMention} from "discord.js";
import {DiscordClient} from "./discordClient";
import {logger} from "./logger";

// TODO: cache instances so we don't have to work so hard to create em

/**
 * Provides logic related to the lifecycle of an Among Us game.
 */
export class GameCoordinator {
    private constructor(private game: Game) {}

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
        const vc = await GameCoordinator.getChannel(voiceChannelId, true);
        if (!vc || !vc.isVoiceBased()) {
            throw "Invalid voice channel id";
        }

        const guild = vc.guild;

        const [alive, dead, spectating] = await Promise.all([
            // creation order does not matter here. Each user will have one of these roles
            // at any time.
            guild.roles.create({name: "Alive", position: 1000}),
            guild.roles.create({name: "Dead", position: 1000}),
            guild.roles.create({name: "Spectating", position: 1000}),
        ]).catch((reject) => []);

        if (!alive || !dead || !spectating) {
            throw "Creating game roles failed";
        }

        const memberIds = vc.members.map((member) => member.id);

        // players in VC start as spectators, will be moved
        // to alive when the game starts
        const createdGame = await Game.create({
            guildId: guild.id,
            channelId: voiceChannelId,
            controlPanelChannelId: controlPanel.channelId,
            controlPanelMessageId: controlPanel.messageId,
            alivePlayerIds: new Array<string>(0),
            aliveRoleId: alive.id,
            deadPlayerIds: new Array<string>(0),
            deadRoleId: dead.id,
            spectatingPlayerIds: memberIds,
            spectatorRoleId: spectating.id,
            state: "created",
        });

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

        const guild = await GameCoordinator.getGuild(this.game.guildId);
        if (!guild) {
            throw "Failed to fetch guild";
        }

        await Promise.all(
            alivePlayerIds.map((id) =>
                guild.members.addRole({user: id, role: this.game.aliveRoleId, reason: "Among us game started"})
            )
        );

        await this.game.update({state: "playing", alivePlayerIds, spectatingPlayerIds, deadPlayerIds});
        await this.updateControlPanel();
    }

    /**
     * Starts a meeting. As the name implies, the corresponding action in-game is
     * an emergency meeting being called, or a body being reported.
     */
    async startMeeting() {
        await this.game.update({state: "meeting"});
    }

    /**
     * Ends a meeting. As the name implies, the corresponding action in-game is
     * a meeting ending after the crew has voted.
     */
    async endMeeting() {
        await this.game.update({state: "playing"});
    }

    /**
     * Ends a game. The corresponding actions in-game include:
     * - the crewmates voting out all impostors
     * - the crewmates winning on tasks
     * - the impostor(s) killing enough crew
     * - the impostor(s) winning by sabotage
     */
    async endGame() {
        await this.game.reload();

        const guild = await GameCoordinator.getGuild(this.game.guildId);
        if (!guild) {
            throw "Guild not found";
        }

        // deleting the roles will remove them from all players. Saves us lots of effort!
        const deleteRole = async (roleId: string) => GameCoordinator.getRole(guild, roleId).then((r) => r?.delete());
        await Promise.all([
            deleteRole(this.game.aliveRoleId),
            deleteRole(this.game.deadRoleId),
            deleteRole(this.game.spectatorRoleId),
        ]);

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

        // If the game has not started, or the player is joining a running game for the first time,
        // add the player as a spectator
        if (this.game.state === "created" || !playerSets.some((set) => set.includes(guildMemberId))) {
            const newSpectators = [...this.game.spectatingPlayerIds, guildMemberId];
            await this.game.update({spectatingPlayerIds: newSpectators});
            await this.updateControlPanel();

            if (this.game.state === "created") {
                // we want to return ONLY if the game hasn't started.
                // If the game has started, we want to fall thru to below to get
                // the spectator role added to the new joiner
                return;
            }
        }

        // I have no idea why but this fixes an issue about reading "id" on undefined below.
        await guildMember.fetch();

        // add back the player's role
        if (this.game.alivePlayerIds.includes(guildMemberId)) {
            await guildMember.roles.add(this.game.aliveRoleId, "Player joined in-progress game");
        } else if (this.game.deadPlayerIds.includes(guildMemberId)) {
            await guildMember.roles.add(this.game.deadRoleId, "Player joined in-progress game");
        } else {
            await guildMember.roles.add(this.game.spectatorRoleId, "Player joined in-progress game");
        }
    }

    /**
     * Informs the coordinator that a player has left the voice channel in which the game is taking place
     * @param guildMember the GuildMember which left the voice channel the game is taking place in
     */
    async playerLeft(guildMember: GuildMember) {
        // todo: should we hide players who are no longer in the VC? On the upside, this makes the control panel more accurate.
        // On the downside, this is more costly and increases the state we need to keep.
        await this.game.reload();

        // Remove their role. If they come back, the correct role will be added back.
        await guildMember.roles.remove(
            [this.game.aliveRoleId, this.game.deadRoleId, this.game.spectatorRoleId],
            "Player left game channel"
        );
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

        const guild = await GameCoordinator.getGuild(this.game.guildId);
        if (!guild) {
            throw "Unable to fetch guild";
        }

        await guild.members.removeRole({user: playerId, role: this.game.aliveRoleId});
        await guild.members.addRole({user: playerId, role: this.game.deadRoleId});

        const newAlive = this.game.alivePlayerIds.filter((id) => id !== playerId);
        const newDead = [...this.game.deadPlayerIds, playerId];

        await this.game.update({alivePlayerIds: newAlive, deadPlayerIds: newDead});
        await this.updateControlPanel();
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
     * Creates an embed which represents the current state of the game. Buttons and other components are *not* included.
     * @returns an embed which can be used to render the control panel
     */
    async getControlPanelEmbed(): Promise<APIEmbed> {
        // this is public because a few places require this embed, and since its a pure function it does not matter
        // if it is called elsewhere.

        await this.game.reload();

        const toPlayerList = (ids: string[]) => ids.sort().map(userMention).join("\n") || "Nobody";
        return new EmbedBuilder()
            .setTitle("Among Us in " + channelMention(this.game.channelId))
            .setFields(
                {name: "Alive", value: toPlayerList(this.game.alivePlayerIds), inline: true},
                {name: "Dead", value: toPlayerList(this.game.deadPlayerIds), inline: true},
                {name: "Spectating", value: toPlayerList(this.game.spectatingPlayerIds), inline: true}
            )
            .toJSON();
    }

    private async updateControlPanel() {
        const channel = await GameCoordinator.getChannel(this.game.controlPanelChannelId);
        if (!channel || !channel.isTextBased()) {
            throw "Unable to fetch control panel channel";
        }

        const controlPanelMessage = await GameCoordinator.getMessage(this.game.controlPanelMessageId, channel);
        if (!controlPanelMessage) {
            throw "Unable to fetch control panel message";
        }

        await controlPanelMessage.edit({embeds: [await this.getControlPanelEmbed()]});
    }

    // todo: relocate these helpers to somewhere else
    private static async getChannel(channelId: string, forceFetch: boolean = false) {
        if (forceFetch) {
            return DiscordClient.channels.fetch(channelId, {force: forceFetch});
        }

        return DiscordClient.channels.cache.get(channelId) ?? DiscordClient.channels.fetch(channelId);
    }

    private static async getMessage(messageId: string, channel: TextBasedChannel) {
        return channel.messages.cache.get(messageId) ?? channel.messages.fetch(messageId);
    }

    private static async getMember(guild: Guild, memberId: string, forceFetch: boolean = false) {
        return guild.members.cache.get(memberId) ?? guild.members.fetch(memberId);
    }

    private static async getGuild(guildId: string) {
        return DiscordClient.guilds.cache.get(guildId) ?? DiscordClient.guilds.fetch(guildId);
    }

    private static async getRole(guild: Guild, roleId: string) {
        return guild.roles.cache.get(roleId) ?? guild.roles.fetch(roleId);
    }
}

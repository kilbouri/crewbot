import {Game} from "./database";
import {APIEmbed, EmbedBuilder, Guild, GuildMember, TextBasedChannel, channelMention, userMention} from "discord.js";
import {DiscordClient} from "./discordClient";

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

        const memberIds = vc.members.map((member) => member.id);

        const createdGame = await Game.create({
            channelId: voiceChannelId,
            controlPanelChannelId: controlPanel.channelId,
            controlPanelMessageId: controlPanel.messageId,
            currentPlayerIds: memberIds,
            state: "created",
        });

        return new this(createdGame);
    }

    // todo: relocate these helpers to somewhere else
    private static async getChannel(channelId: string, forceFetch: boolean = false) {
        if (forceFetch) {
            return DiscordClient.channels.fetch(channelId, {force: forceFetch});
        }

        return DiscordClient.channels.cache.get(channelId) ?? (await DiscordClient.channels.fetch(channelId));
    }

    private static async getMessage(messageId: string, channel: TextBasedChannel) {
        return channel.messages.cache.get(messageId) ?? (await channel.messages.fetch(messageId));
    }

    private static async getGuild(guildId: string) {
        return DiscordClient.guilds.cache.get(guildId) ?? (await DiscordClient.guilds.fetch(guildId));
    }

    private static async getRole(guild: Guild, roleId: string) {
        return guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId));
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
        await this.game.update({state: "playing"});
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
        await this.game.destroy();
    }

    /**
     * Informs the coordinator that a player has joined the voice channel in which the game is taking place
     * @param player the GuildMember which joined the voice channel the game is taking place in
     */
    async playerJoined(player: GuildMember) {
        await this.game.reload();
        if (this.game.currentPlayerIds.includes(player.id)) {
            return;
        }

        const newPlayerIds = [...this.game.currentPlayerIds, player.id];
        await this.game.update({currentPlayerIds: newPlayerIds});

        await this.updateControlPanel();
    }

    /**
     * Informs the coordinator that a player has left the voice channel in which the game is taking place
     * @param player the GuildMember which left the voice channel the game is taking place in
     */
    async playerLeft(player: GuildMember) {
        await this.game.reload();
        if (!this.game.currentPlayerIds.includes(player.id)) {
            return;
        }

        const newPlayerIds = this.game.currentPlayerIds.filter((id) => id !== player.id);
        await this.game.update({currentPlayerIds: newPlayerIds});

        await this.updateControlPanel();
    }

    /**
     * Creates an embed which represents the current state of the game. Buttons and other components are *not* included.
     * @returns an embed which can be used to render the control panel
     */
    getControlPanelEmbed(): APIEmbed {
        // this is public because a few places require this embed, and since its a pure function it does not matter
        // if it is called elsewhere.

        const toPlayerList = (ids: string[]) => ids.map(userMention).join("\n") || "Nobody";
        return new EmbedBuilder()
            .setTitle("Among Us in " + channelMention(this.game.channelId))
            .setFields(
                {name: "Alive", value: toPlayerList(this.game.currentPlayerIds), inline: true},
                {name: "Dead", value: toPlayerList([]), inline: true},
                {name: "Spectating", value: toPlayerList([]), inline: true}
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

        await controlPanelMessage.edit({embeds: [this.getControlPanelEmbed()]});
    }
}

import {
    APIEmbed,
    userMention,
    EmbedBuilder,
    channelMention,
    ActionRowBuilder,
    MessageActionRowComponentBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
} from "discord.js";
import {BuildButtonId} from "./buttons";
import {Game} from "./database";
import {DiscordUtil} from "./discordUtil";

export class ControlPanelManager {
    private constructor(private game: Game, private message: Message) {}

    static async forGame(game: Game) {
        await game.reload();

        const channel = await DiscordUtil.getChannel(game.controlPanelChannelId);
        if (!channel || !channel.isTextBased()) {
            throw "Unable to fetch control panel channel";
        }

        const controlPanelMessage = await DiscordUtil.getMessage(game.controlPanelMessageId, channel);
        if (!controlPanelMessage) {
            throw "Unable to fetch control panel message";
        }

        return new this(game, controlPanelMessage);
    }

    /**
     * Creates an embed which represents the current state of the game. Buttons and other components are *not* included.
     * @returns an embed which can be used to render the control panel
     */
    private async getControlPanelEmbed(): Promise<APIEmbed> {
        await this.game.reload();

        if (this.game.state === "ended") {
            return new EmbedBuilder()
                .setTitle("Game Ended")
                .setDescription("This game of Among Us has ended. Use `/newgame` to create a new one!")
                .toJSON();
        }

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

    private async getControlPanelComponents() {
        await this.game.reload();

        const gameStateRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        const gameLifecycleRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

        const gameStartedButton = new ButtonBuilder()
            .setLabel("Game Started")
            .setStyle(ButtonStyle.Success)
            .setCustomId(BuildButtonId("gameStarted", this.game.channelId));

        const gameEndedButton = new ButtonBuilder()
            .setLabel("Game Ended")
            .setStyle(ButtonStyle.Danger)
            .setCustomId(BuildButtonId("gameEnded", this.game.channelId));

        const meetingStartButton = new ButtonBuilder()
            .setLabel("Meeting Started")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BuildButtonId("meetingStart", this.game.channelId));

        const meetingEndButton = new ButtonBuilder()
            .setLabel("Meeting Ended")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BuildButtonId("meetingEnd", this.game.channelId));

        const playerDiedButton = new ButtonBuilder()
            .setLabel("Player Died")
            .setStyle(ButtonStyle.Danger)
            .setCustomId(BuildButtonId("playerDied", this.game.channelId));

        switch (this.game.state) {
            case "created":
                gameStateRow.setComponents([]);
                gameLifecycleRow.setComponents([gameStartedButton, gameEndedButton]);
                break;

            case "playing":
                gameStateRow.setComponents([meetingStartButton, playerDiedButton]);
                gameLifecycleRow.setComponents([gameEndedButton]);
                break;

            case "meeting":
                gameStateRow.setComponents([meetingEndButton, playerDiedButton]);
                gameLifecycleRow.setComponents([gameEndedButton]);
                break;

            case "ended":
                gameStateRow.setComponents([]);
                gameLifecycleRow.setComponents([]);
                break;
        }

        return [gameStateRow.toJSON(), gameLifecycleRow.toJSON()].filter((row) => row.components.length > 0);
    }

    /**
     * Updates the control panel according to the current state of the game
     */
    async update() {
        const [embed, components] = await Promise.all([this.getControlPanelEmbed(), this.getControlPanelComponents()]);

        if (!embed || !components) {
            throw "Failed to fetch updated control panel";
        }

        await this.message.edit({embeds: [embed], components: components});
    }
}

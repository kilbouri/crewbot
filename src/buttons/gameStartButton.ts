import {ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder} from "discord.js";
import {BuildButtonId, ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const gameStartButton: ButtonType = {
    buttonId: "gameStart",
    execute: async (intr, channelId: string) => {
        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        await coordinator.startGame();

        // create an updated action row
        const ingameEventRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Meeting Started")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BuildButtonId("meetingStart", channelId)),
            new ButtonBuilder()
                .setLabel("Player Died")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("playerDied", channelId))
        );

        const gameLifecycleRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Game Ended")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("gameEnd", channelId))
        );

        // edit the original message
        await intr.update({components: [ingameEventRow, gameLifecycleRow]});
    },
};

export {gameStartButton as button};

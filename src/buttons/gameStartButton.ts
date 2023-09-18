import {ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder} from "discord.js";
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
        const newActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Meeting Started")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BuildButtonId("meetingStart", channelId)),
            new ButtonBuilder()
                .setLabel("Game Ended")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("gameEnd", channelId))
        );

        // edit the original message
        await intr.update({components: [newActionRow]});
    },
};

export {gameStartButton as button};

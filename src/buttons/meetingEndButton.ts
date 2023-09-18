import {ActionRowBuilder, MessageActionRowComponentBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import {BuildButtonId, ButtonType} from ".";
import {StartMeeting} from "../gameCoordinator";

const meetingEndButton: ButtonType = {
    buttonId: "meetingEnd",
    execute: async (intr, gameId: string) => {
        await StartMeeting(gameId);

        // create an updated action row
        const newActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Meeting Started")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BuildButtonId("meetingStart", gameId)),
            new ButtonBuilder()
                .setLabel("Game Ended")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("gameEnd", gameId))
        );

        // edit the original message
        await intr.update({components: [newActionRow]});
    },
};

export {meetingEndButton as button};

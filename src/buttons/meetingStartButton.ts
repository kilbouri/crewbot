import {ActionRowBuilder, MessageActionRowComponentBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import {BuildButtonId, ButtonType} from ".";
import {StartMeeting} from "../gameCoordinator";

const meetingStartButton: ButtonType = {
    buttonId: "meetingStart",
    execute: async (intr, gameId: string) => {
        await StartMeeting(gameId);

        // create an updated action row
        const newActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Meeting Ended")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BuildButtonId("meetingEnd", gameId)),
            new ButtonBuilder()
                .setLabel("Game Ended")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("gameEnd", gameId))
        );

        // edit the original message
        await intr.update({components: [newActionRow]});
    },
};

export {meetingStartButton as button};

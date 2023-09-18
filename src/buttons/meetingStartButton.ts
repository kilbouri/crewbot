import {ActionRowBuilder, MessageActionRowComponentBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import {BuildButtonId, ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const meetingStartButton: ButtonType = {
    buttonId: "meetingStart",
    execute: async (intr, channelId: string) => {
        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        await coordinator.startMeeting();

        // create an updated action row
        const newActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Meeting Ended")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BuildButtonId("meetingEnd", channelId)),
            new ButtonBuilder()
                .setLabel("Game Ended")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(BuildButtonId("gameEnd", channelId))
        );

        // edit the original message
        await intr.update({components: [newActionRow]});
    },
};

export {meetingStartButton as button};

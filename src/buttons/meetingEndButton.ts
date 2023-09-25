import {ActionRowBuilder, MessageActionRowComponentBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import {BuildButtonId, ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const meetingEndButton: ButtonType = {
    buttonId: "meetingEnd",
    execute: async (intr, channelId: string) => {
        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        await coordinator.endMeeting();
        await intr.update({});
    },
};

export {meetingEndButton as button};

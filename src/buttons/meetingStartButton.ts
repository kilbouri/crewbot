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
        await intr.update({});
    },
};

export {meetingStartButton as button};

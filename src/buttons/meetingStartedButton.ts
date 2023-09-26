import {ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const meetingStartButton: ButtonType = {
    buttonId: "meetingStarted",
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

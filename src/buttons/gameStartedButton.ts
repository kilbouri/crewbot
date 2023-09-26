import {ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const gameStartButton: ButtonType = {
    buttonId: "gameStarted",
    execute: async (intr, channelId: string) => {
        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        await coordinator.startGame();
        await intr.update({});
    },
};

export {gameStartButton as button};

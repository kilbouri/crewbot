import {ButtonType} from ".";
import {logger} from "../logger";

const gameStartButton: ButtonType = {
    buttonId: "gameStart",
    execute: async (interaction, ...args) => {
        logger.info(args);
        await interaction.reply("Received!");
    },
};

export {gameStartButton as button};

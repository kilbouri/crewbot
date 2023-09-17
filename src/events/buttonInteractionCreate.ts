import {CacheType, Client, Interaction} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";
import {GetButton, ParseButtonId} from "../buttons";

const interactionCreateModule: EventType = {
    eventName: "interactionCreate",
    once: false,
    execute: async (client: Client<true>, interaction: Interaction<CacheType>) => {
        if (!interaction.isButton()) {
            return;
        }

        const customId = interaction.customId;
        const {buttonName, args} = ParseButtonId(customId);
        const buttonHandler = GetButton(buttonName);

        if (!buttonHandler) {
            logger.warn(`Received button interaction for unknown button: ${buttonName}`);
            return;
        }

        try {
            await buttonHandler.execute(interaction, ...args);
        } catch (error) {
            logger.error(`Failed to execute button '${buttonName}': ${error}`);
        }
    },
};

export {interactionCreateModule as event};

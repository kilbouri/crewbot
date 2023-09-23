import {CacheType, Client, Interaction} from "discord.js";
import {EventType} from ".";
import {GetCommand} from "../commands";
import {logger} from "../logger";

const interactionCreateModule: EventType = {
    eventName: "interactionCreate",
    once: false,
    execute: async (client: Client<true>, interaction: Interaction<CacheType>) => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const commandName = interaction.commandName;
        const command = GetCommand(commandName);

        if (!command) {
            logger.warn(`Received chat interaction for unknown command: ${commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Failed to execute command '${commandName}': ${error}`);
        }
    },
};

export {interactionCreateModule as event};

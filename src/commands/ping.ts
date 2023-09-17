import {SlashCommandBuilder} from "@discordjs/builders";
import {CacheType, ChatInputCommandInteraction} from "discord.js";
import {CommandType} from ".";

const pingCommand: CommandType = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Ping. Pong?"),
    execute: async (intr: ChatInputCommandInteraction<CacheType>) => {
        return intr.reply("Pong!");
    },
};

export {pingCommand as command};

import {readdir} from "fs/promises";
import path from "path";
import {
    CacheType,
    ChatInputCommandInteraction,
    REST,
    Routes,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import {logger} from "../logger";

interface CommandType {
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
    deferMode: "NORMAL" | "EPHEMERAL" | "NO-DEFER";
    execute: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<any>;
}

const commandCache = new Map<string, CommandType>();
let commandsLoaded = false;

const LoadCommands = async (options: {
    guild?: string;
    apiToken: string;
    appId: string;
}) => {
    const {guild, apiToken, appId} = options;

    logger.info(`Loading commands from '${__dirname}'`);

    const modules = (await readdir(__dirname)) //
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((name) => name.slice(0, -path.extname(name).length))
        .filter((name) => name !== "index")
        .map((name) => require(path.resolve(__dirname, name)) as {command: CommandType});

    const rest = new REST({version: "10"}).setToken(apiToken);
    const route = guild
        ? Routes.applicationGuildCommands(appId, guild)
        : Routes.applicationCommands(appId);

    const commandData = modules.map((module) => module.command.data.toJSON());
    await rest.put(route, {body: commandData});

    modules.forEach((module) =>
        commandCache.set(module.command.data.name, module.command)
    );

    commandsLoaded = true;
};

const GetCommand = (name: string) => {
    if (!commandsLoaded) {
        throw "LoadCommands must finish before GetCommand may be called";
    }

    return commandCache.get(name);
};

export {GetCommand, LoadCommands, CommandType};

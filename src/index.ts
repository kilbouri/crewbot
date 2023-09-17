import {LoadCommands} from "./commands";
import {Config} from "./config";
import {LoadEvents} from "./events";
import {logger} from "./logger";
import {Client} from "discord.js";

let client: Client | undefined;

const start = async () => {
    const apiConfig = Config.devMode ? Config.development : Config.production;

    client = new Client({intents: []});

    if (Config.devMode) {
        client.on("error", logger.error);
        client.on("warn", logger.warn);
    }

    await LoadCommands(apiConfig);
    await LoadEvents(client);

    client.login(apiConfig.apiToken);
};

// graceful exit handler
require("shutdown-handler").on("exit", (event: Event) => {
    event.preventDefault(); // delay process closing

    client?.emit("shutdown");

    logger.info("Shutdown completed. Exiting...");
    process.exit();
});

// start bot
start();

import {LoadButtons} from "./buttons";
import {LoadCommands} from "./commands";
import {Config} from "./config";
import {InitializeDatabase} from "./database";
import {DiscordClient} from "./discordClient";
import {LoadEvents} from "./events";
import {logger} from "./logger";

const start = async () => {
    const apiConfig = Config.devMode ? Config.development : Config.production;

    DiscordClient.on("error", logger.error);
    DiscordClient.on("warn", logger.warn);

    await InitializeDatabase();
    await LoadCommands(apiConfig);
    await LoadButtons();
    await LoadEvents();

    DiscordClient.login(apiConfig.apiToken);
};

// graceful exit handler
require("shutdown-handler").on("exit", (event: Event) => {
    event.preventDefault(); // delay process closing

    if (DiscordClient.isReady()) {
        DiscordClient.emit("shutdown");
    }

    logger.info("Shutdown completed. Exiting...");
    process.exit();
});

// start bot
start();

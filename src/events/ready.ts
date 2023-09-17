import {ActivityType, Client} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";

const readyModule: EventType = {
    eventName: "ready",
    once: true,
    execute: async (client: Client<true>) => {
        client.user.setActivity({
            type: ActivityType.Watching,
            name: "your games",
        });

        logger.info("Bot is ready");
    },
};

export {readyModule as event};

import {readdir} from "fs/promises";
import path from "path";
import {Client} from "discord.js";
import {logger} from "../logger";

interface EventType {
    eventName: string;
    once: boolean;
    execute: (client: Client, ...args: any[]) => Promise<any>;
}

const LoadEvents = async (client: Client) => {
    logger.info(`Loading events from '${__dirname}'`);

    const modules = (await readdir(__dirname)) //
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((name) => name.slice(0, -path.extname(name).length))
        .filter((name) => name !== "index")
        .map((name) => require(path.resolve(__dirname, name)) as {event: EventType});

    for (const {event} of modules) {
        const eventCallback = async (...args: any[]) => {
            try {
                await event.execute(client, ...args);
            } catch (error) {
                logger.error(`Failed to handle '${event.eventName}' event: ${error}`);
            }
        };

        if (event.once) {
            client.once(event.eventName, eventCallback);
        } else {
            client.on(event.eventName, eventCallback);
        }
    }
};

export {LoadEvents, EventType};

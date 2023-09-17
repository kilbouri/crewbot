import {readdir} from "fs/promises";
import path from "path";
import {ButtonInteraction, CacheType} from "discord.js";
import {logger} from "../logger";

interface ButtonType {
    buttonId: string;
    execute: (interaction: ButtonInteraction<CacheType>, ...args: any[]) => Promise<any>;
}

const buttonCache = new Map<string, ButtonType>();
let buttonsLoaded = false;

const LoadButtons = async () => {
    logger.info(`Loading buttons from '${__dirname}'`);

    const modules = (await readdir(__dirname)) //
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((name) => name.slice(0, -path.extname(name).length))
        .filter((name) => name !== "index")
        .map((name) => require(path.resolve(__dirname, name)) as {button: ButtonType});

    modules.forEach((module) => buttonCache.set(module.button.buttonId, module.button));
    buttonsLoaded = true;
};

const GetButton = (name: string) => {
    if (!buttonsLoaded) {
        throw "LoadButtons must finish before GetButton may be called";
    }

    return buttonCache.get(name);
};

const BuildButtonId = (buttonName: string, ...args: any[]) => {
    return JSON.stringify({
        buttonName,
        args,
    });
};

const ParseButtonId = (buttonId: string) => {
    return JSON.parse(buttonId) as {buttonName: string; args: any[]};
};

export {GetButton, LoadButtons, ButtonType, BuildButtonId, ParseButtonId};

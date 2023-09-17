import {readFileSync} from "fs";
import {logger} from "./logger";
import {parse as parseJSON5} from "json5";
import path from "path";

interface ModeType {
    apiToken: string;
    appId: string;
    guild?: string;
}

interface ConfigType {
    // discord API config
    production: ModeType;
    development: ModeType;

    devMode: boolean;
}

const Config: ConfigType = (() => {
    const configPath = path.resolve(__dirname, "../config.json5");
    logger.info(`Reading configuration from '${configPath}'`);

    const data = readFileSync(configPath, "utf-8");
    const loadedConfig = parseJSON5(data) as ConfigType;

    logger.level = loadedConfig.devMode ? "debug" : "info";
    return loadedConfig;
})();

export {Config, ConfigType};

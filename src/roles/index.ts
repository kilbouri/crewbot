import {readdir} from "fs/promises";
import {GameState} from "../database";
import {logger} from "../logger";
import path from "path";

interface ExpectedVoiceState {
    deafened: boolean;
    muted: boolean;
}

interface RoleType {
    name: string;
    getExpectedVoiceState: (state: Exclude<GameState, "created">) => Promise<ExpectedVoiceState>;
}

const roleCache = new Map<string, RoleType>();
let rolesLoaded = false;

const LoadRoles = async () => {
    if (rolesLoaded) {
        logger.debug("LoadRoles called, but roles have already been loaded. Ignoring.");
        return;
    }

    logger.info(`Loading roles from '${__dirname}'`);

    const modules = (await readdir(__dirname)) //
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((name) => name.slice(0, -path.extname(name).length))
        .filter((name) => name !== "index")
        .map((name) => require(path.resolve(__dirname, name)) as {role: RoleType});

    modules.forEach((module) => roleCache.set(module.role.name, module.role));
    rolesLoaded = true;
};

const GetRole = (name: string) => {
    if (!rolesLoaded) {
        throw "LoadRoles must finish before GetRole may be called";
    }

    return roleCache.get(name);
};

export {GetRole, LoadRoles, RoleType};

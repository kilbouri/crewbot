import {Sequelize, DataTypes, Model} from "sequelize";
import {Config} from "./config";

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "database.sqlite",
});

interface Game {
    channelId: string;
    controlPanelMessageId: string;
    controlPanelChannelId: string;
    state: "created" | "playing" | "meeting";
}

const Games = sequelize.define<Model<Game>>("games", {
    channelId: {
        type: DataTypes.STRING(32),
        primaryKey: true,
    },
    controlPanelMessageId: DataTypes.STRING(32),
    controlPanelChannelId: DataTypes.STRING(32),
    state: DataTypes.STRING(8),
});

/**
 * Prepares the bot's database. This includes creating the
 * required files on disk if they do not exist, as well as
 * synchronizing all defined models.
 */
const InitializeDatabase = async () => {
    await sequelize.sync({alter: Config.devMode});
};

export {Games, InitializeDatabase};

import {Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes} from "sequelize";
import {Config} from "./config";

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "database.sqlite",
});

class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
    declare channelId: string;
    declare controlPanelMessageId: string;
    declare controlPanelChannelId: string;
    declare currentPlayerIds: string[];
    declare state: "created" | "playing" | "meeting";
}

Game.init(
    {
        channelId: {
            type: DataTypes.STRING(32),
            primaryKey: true,
        },
        controlPanelMessageId: DataTypes.STRING(32),
        controlPanelChannelId: DataTypes.STRING(32),
        currentPlayerIds: {
            type: DataTypes.TEXT(),
            get(this: Game) {
                const dataVal = this.getDataValue("currentPlayerIds") as unknown as string;
                return dataVal.split(";"); // this is a safe separator for user ids
            },
            set(val: string[]) {
                const dataVal = val.join(";") as unknown as string[];
                this.setDataValue("currentPlayerIds", dataVal);
            },
        },
        state: DataTypes.STRING(8),
    },
    {sequelize}
);

/**
 * Prepares the bot's database. This includes creating the
 * required files on disk if they do not exist, as well as
 * synchronizing all defined models.
 */
const InitializeDatabase = async () => {
    await sequelize.sync({alter: Config.devMode});
};

export {Game as Game, InitializeDatabase};

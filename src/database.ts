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
    declare alivePlayerIds: Set<string>;
    declare deadPlayerIds: Set<string>;
    declare spectatingPlayerIds: Set<string>;
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
        alivePlayerIds: {
            type: DataTypes.TEXT(),
            get(this: Game) {
                const dataVal = this.getDataValue("alivePlayerIds") as unknown as string;
                return new Set<string>(dataVal.split(";").filter((id) => id));
            },
            set(val: Set<string>) {
                const dataVal = new Array(val.values()).join(";") as unknown as Set<string>;
                this.setDataValue("alivePlayerIds", dataVal);
            },
        },
        deadPlayerIds: {
            type: DataTypes.TEXT(),
            get(this: Game) {
                const dataVal = this.getDataValue("deadPlayerIds") as unknown as string;
                return new Set<string>(dataVal.split(";").filter((id) => id));
            },
            set(val: Set<string>) {
                const dataVal = new Array(val.values()).join(";") as unknown as Set<string>;
                this.setDataValue("deadPlayerIds", dataVal);
            },
        },
        spectatingPlayerIds: {
            type: DataTypes.TEXT(),
            get(this: Game) {
                const dataVal = this.getDataValue("spectatingPlayerIds") as unknown as string;
                return new Set<string>(dataVal.split(";").filter((id) => id));
            },
            set(val: Set<string>) {
                const dataVal = new Array(val.values()).join(";") as unknown as Set<string>;
                this.setDataValue("spectatingPlayerIds", dataVal);
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

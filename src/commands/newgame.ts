import {ChannelType, EmbedBuilder, SlashCommandBuilder, SlashCommandChannelOption} from "discord.js";
import {CommandType} from ".";
import {Games} from "../database";

const newgameModule: CommandType = {
    data: new SlashCommandBuilder()
        .setName("newgame")
        .setDescription("Start a new game of Among Us")
        .setDMPermission(false)
        .addChannelOption(
            new SlashCommandChannelOption()
                .setName("channel")
                .setDescription("Which channel is the game taking place in?")
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        ),
    execute: async (intr) => {
        const options = intr.options;
        const channel = options.getChannel("channel", true, [ChannelType.GuildVoice]);

        const existingGame = await Games.findOne({where: {channelId: channel.id}});
        if (existingGame) {
            return intr.reply("There's already a game in that channel");
        }

        const newGame = await Games.create({channelId: channel.id});
        return intr.reply(`Created a game in ${channel.toString()}`);
    },
};

export {newgameModule as command};

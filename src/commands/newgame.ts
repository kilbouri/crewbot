import {ChannelType, EmbedBuilder, SlashCommandBuilder, SlashCommandChannelOption} from "discord.js";
import {CommandType} from ".";
import {Game} from "../database";
import {GameCoordinator} from "../gameCoordinator";

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

        const existingGame = await Game.findOne({where: {channelId: channel.id}});
        if (existingGame) {
            return intr.reply({content: "There's already a game in that channel", ephemeral: true});
        }

        // intermediate response to determine reply message id
        const gameCreatingEmbed = new EmbedBuilder()
            .setTitle("Creating game...")
            .setDescription(`A game in ${channel.toString()} is being created. Please wait :)`);

        await intr.reply({embeds: [gameCreatingEmbed]});
        const editedReply = await intr.editReply({embeds: [gameCreatingEmbed]});

        await GameCoordinator.createGame(channel.id, {
            channelId: intr.channelId,
            messageId: editedReply.id,
        });
    },
};

export {newgameModule as command};

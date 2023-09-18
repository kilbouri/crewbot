import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    SlashCommandBuilder,
    SlashCommandChannelOption,
} from "discord.js";
import {CommandType} from ".";
import {Games} from "../database";
import {CreateGame} from "../gameCoordinator";
import {BuildButtonId} from "../buttons";

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
            return intr.reply({content: "There's already a game in that channel", ephemeral: true});
        }

        const alivePlayers = channel.members.map((m) => m.displayName).join("\n");
        const embed = new EmbedBuilder().setTitle(`Among Us in ${channel.toString()}`).addFields(
            {
                name: "Alive",
                value: alivePlayers || "Nobody",
                inline: true,
            },
            {
                name: "Dead",
                value: "Nobody",
                inline: true,
            }
        );

        const gameId = await CreateGame(channel.id);

        const gameStartedButton = new ButtonBuilder() //
            .setLabel("Game Started")
            .setCustomId(BuildButtonId("gameStart", gameId))
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>() //
            .addComponents(gameStartedButton);

        return intr.reply({embeds: [embed], components: [actionRow]});
    },
};

export {newgameModule as command};

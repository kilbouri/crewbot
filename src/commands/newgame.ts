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
import {Game} from "../database";
import {BuildButtonId} from "../buttons";
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

        const replyMessage = await intr.reply({embeds: [gameCreatingEmbed]});

        // We can now create the game and update the embed
        const coordinator = await GameCoordinator.createGame(channel.id, {
            channelId: intr.channelId,
            messageId: replyMessage.id,
        });

        const embed = coordinator.getControlPanelEmbed();

        const gameStartedButton = new ButtonBuilder() //
            .setLabel("Game Started")
            .setCustomId(BuildButtonId("gameStart", channel.id))
            .setStyle(ButtonStyle.Primary);

        const gameEndedButton = new ButtonBuilder()
            .setLabel("Game Ended")
            .setStyle(ButtonStyle.Danger)
            .setCustomId(BuildButtonId("gameEnd", channel.id));

        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>() //
            .addComponents(gameStartedButton, gameEndedButton);

        const response = await intr.editReply({embeds: [embed], components: [actionRow]});
        await coordinator.setControlPanel(response.channelId, response.id);
    },
};

export {newgameModule as command};

import {
    ChannelType,
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandChannelOption,
} from "discord.js";
import {CommandType} from ".";

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

        const voiceUserString = channel.members.map((m) => m.toString()).join(", ");
        return await intr.reply(voiceUserString || "Nobody in " + channel.toString());

        const gameEmbed = new EmbedBuilder();

        gameEmbed.setTitle(`Among Us in ${channel.toString()}`);
        gameEmbed.setDescription("There is now a game running in " + channel.toString());

        await intr.reply({embeds: [gameEmbed]});
    },
};

export {newgameModule as command};

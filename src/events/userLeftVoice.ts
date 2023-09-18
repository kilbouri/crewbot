import {GuildMember, channelMention} from "discord.js";
import {EventType} from ".";
import {GetGameInChannel} from "../gameCoordinator";
import {logger} from "../logger";

const userLeftVoice: EventType = {
    eventName: "userLeftVoice",
    once: false,
    execute: async (client, channelId: string, guildMember: GuildMember) => {
        // check if there is a game in the left channel
        const channelGame = await GetGameInChannel(channelId);
        if (!channelGame) {
            // no game in the channel the user left
            return;
        }

        // there is a game running here.
        logger.info(`${guildMember.toString()} left the game in ${channelMention(channelId)}`);
    },
};

export {userLeftVoice as event};

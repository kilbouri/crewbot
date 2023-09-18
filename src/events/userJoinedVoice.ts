import {GuildMember, channelMention} from "discord.js";
import {EventType} from ".";
import {GetGameInChannel} from "../gameCoordinator";
import {logger} from "../logger";

const userJoinedVoice: EventType = {
    eventName: "userJoinedVoice",
    once: false,
    execute: async (client, channelId: string, guildMember: GuildMember) => {
        // check if there is a game in the joined channel
        const channelGame = await GetGameInChannel(channelId);
        if (!channelGame) {
            // no game in the channel the user joined
            return;
        }

        // there is a game running here.
        logger.info(`${guildMember.toString()} joined the game in ${channelMention(channelId)}`);
    },
};

export {userJoinedVoice as event};

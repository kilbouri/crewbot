import {GuildMember, channelMention} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";
import {GameCoordinator} from "../gameCoordinator";

const userJoinedVoice: EventType = {
    eventName: "userJoinedVoice",
    once: false,
    execute: async (client, channelId: string, guildMember: GuildMember) => {
        // check if there is a game in the joined channel
        const coordinator = GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        // there is a game running here.
        logger.info(`${guildMember.toString()} joined the game in ${channelMention(channelId)}`);
    },
};

export {userJoinedVoice as event};

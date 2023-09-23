import {GuildMember, channelMention} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";
import {GameCoordinator} from "../gameCoordinator";

const userLeftVoice: EventType = {
    eventName: "userLeftVoice",
    once: false,
    execute: async (client, channelId: string, guildMember: GuildMember) => {
        // check if there is a game in the left channel
        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        // there is a game running here.
        logger.info(`${guildMember.toString()} left the game in ${channelMention(channelId)}`);
        await coordinator.playerLeft(guildMember.id);
    },
};

export {userLeftVoice as event};

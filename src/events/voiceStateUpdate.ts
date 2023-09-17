import {Client, GuildMember, VoiceState} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";

/**
 * Converts a voiceStateUpdate event into one of three:
 *
 * 1. userJoinedVoice - User joined a channel. Event handlers are
 *    provided the id of the channel joined, and the GuildMember who
 *    joined it
 *
 * 2. userLeftVoice - User left a channel. Event handlers are provided
 *    the id of the channel left, and the GuildMember who left it
 *
 * 3. userMovedVoice - User moved between two channels. Event handlers
 *    are provided the id of the channel left, the channel joined,
 *    and the GuildMember who moved
 */
const voiceStateUpdateModule: EventType = {
    eventName: "voiceStateUpdate",
    once: false,
    execute: async (client: Client<true>, oldState: VoiceState, newState: VoiceState) => {
        const from = oldState.channelId;
        const to = newState.channelId;

        const guildMember = newState.member ?? oldState.member;
        if (!guildMember) {
            logger.warn("A voiceStateUpdate was received with no associated GuildMember");
            return;
        }

        let eventName: string;
        let eventArgs: [string, GuildMember] | [string, string, GuildMember];

        if (!from && to) {
            // joined
            eventName = "userJoinedVoice";
            eventArgs = [to, guildMember];
        } else if (from && !to) {
            // left
            eventName = "userLeftVoice";
            eventArgs = [from, guildMember];
        } else if (from && to) {
            // moved
            eventName = "userMovedVoice";
            eventArgs = [from, to, guildMember];
        } else {
            logger.warn("A voiceStateUpdate was received with neither a 'to' nor 'from' voice channel");
            return;
        }

        logger.debug(`Converted 'voiceStateUpdate' event to '${eventName}' with arguments [${eventArgs}]`);
        client.emit(eventName, ...eventArgs);
    },
};

export {voiceStateUpdateModule as event};

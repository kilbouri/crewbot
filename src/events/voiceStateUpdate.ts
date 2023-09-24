import {Client, GuildMember, VoiceState} from "discord.js";
import {EventType} from ".";
import {logger} from "../logger";

/**
 * Converts a voiceStateUpdate event into a combination of the following:
 *
 * 1. userJoinedVoice - User joined a channel. Event handlers are
 *    provided the id of the channel joined, and the GuildMember who
 *    joined it
 *
 * 2. userLeftVoice - User left a channel. Event handlers are provided
 *    the id of the channel left, and the GuildMember who left it
 *
 * A "move" from one channel to another is considered a combination of a leave and join.
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

        if (from === to) {
            logger.debug("A voiceStateUpdate was received, but the to and from channels are the same");
            return;
        }

        const eventsToDispatch: {name: string; args: [string, GuildMember]}[] = [];

        if (from) {
            // left a channel
            eventsToDispatch.push({name: "userLeftVoice", args: [from, guildMember]});
        }

        if (to) {
            // joined a channel
            eventsToDispatch.push({name: "userJoinedVoice", args: [to, guildMember]});
        }

        for (const {name, args} of eventsToDispatch) {
            logger.debug(`Converted 'voiceStateUpdate' event to '${name}' with arguments [${args}]`);
            client.emit(name, ...args);
        }
    },
};

export {voiceStateUpdateModule as event};

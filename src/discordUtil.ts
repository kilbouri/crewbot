import {TextBasedChannel, Guild} from "discord.js";
import {DiscordClient} from "./discordClient";

export class DiscordUtil {
    /**
     * Fetches a channel. Unless `forceFetch` is specified, tries the cache first.
     * @param channelId the id of the channel to fetch
     * @param forceFetch whether or not to force fetch the channel
     * @returns the channel if it exists, otherwise undefined
     */
    static async getChannel(channelId: string, forceFetch: boolean = false) {
        if (forceFetch) {
            return DiscordClient.channels.fetch(channelId, {force: forceFetch});
        }

        return DiscordClient.channels.cache.get(channelId) ?? DiscordClient.channels.fetch(channelId);
    }

    /**
     * Fetches a message in the specified channel. Tries the cache first.
     * @param messageId the id of the message to fetch
     * @param channel the channel in which the message resides
     * @returns the message if it exists, otherwise undefined
     */
    static async getMessage(messageId: string, channel: TextBasedChannel) {
        return channel.messages.cache.get(messageId) ?? channel.messages.fetch(messageId);
    }

    /**
     * Fetches a guild member. Unless `forceFetch` is specified, tries the cache first.
     * @param guild the guild in which to find the member
     * @param memberId the id of the guild member to fetch
     * @param forceFetch whether or not to force fetch the channel
     * @returns the guild member if they exist, otherwise undefined
     */
    static async getMember(guild: Guild, memberId: string, forceFetch: boolean = false) {
        return guild.members.cache.get(memberId) ?? guild.members.fetch(memberId);
    }

    /**
     * Fetches a guild. Tries the cache first.
     * @param guildId the id of the guild to fetch
     * @returns the guild if it exists, otherwise undefined
     */
    static async getGuild(guildId: string) {
        return DiscordClient.guilds.cache.get(guildId) ?? DiscordClient.guilds.fetch(guildId);
    }
}

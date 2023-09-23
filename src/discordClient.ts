import {Client} from "discord.js";

/**
 * A globally accessible instance of the Discord client. This client is the same
 * as the one provided by other objects in DiscordJS (such as Interactions).
 */
const DiscordClient: Client<true> = new Client({intents: ["GuildVoiceStates", "GuildMembers"]});

export {DiscordClient};

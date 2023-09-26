import {Guild} from "discord.js";
import {Game} from "./database";
import {DiscordUtil} from "./discordUtil";
import {GetRole, LoadRoles} from "./roles";

export class VoiceManager {
    private constructor(private game: Game, private guild: Guild) {}

    /**
     * @param game the game for which to create the voice manager
     * @returns a VoiceManager for the specified game
     */
    static async forGame(game: Game) {
        const guild = await DiscordUtil.getGuild(game.guildId);
        if (!guild) {
            throw "Failed to fetch guild";
        }

        return new this(game, guild);
    }

    /**
     * Ensures all players have their voice state set according to their current state in the game.
     * NOTE: this is a somewhat expensive function to call, as it checks every single player. Use
     * `ensureGuildMemberVoiceState` to update a single guild member.
     */
    async ensureVoiceState() {
        await Promise.all([LoadRoles(), this.game.reload()]);

        const batchUpdateState = async (ids: string[], voiceState: {deaf: boolean; mute: boolean}) => {
            await Promise.all(ids.map((id) => this.guild.members.edit(id, voiceState)));
        };

        if (this.game.state === "created" || this.game.state === "ended") {
            await batchUpdateState(
                [...this.game.alivePlayerIds, ...this.game.deadPlayerIds, ...this.game.spectatingPlayerIds],
                {deaf: false, mute: false}
            );

            return;
        }

        const aliveState = await GetRole("Alive")?.getExpectedVoiceState(this.game.state);
        const deadState = await GetRole("Dead")?.getExpectedVoiceState(this.game.state);
        const spectatorState = await GetRole("Spectator")?.getExpectedVoiceState(this.game.state);

        if (!aliveState || !deadState || !spectatorState) {
            throw "One or more role definitions missing";
        }

        await Promise.all([
            batchUpdateState(this.game.alivePlayerIds, aliveState),
            batchUpdateState(this.game.deadPlayerIds, deadState),
            batchUpdateState(this.game.spectatingPlayerIds, spectatorState),
        ]);
    }

    /**
     * Ensures the specified member in the specified guild has the correct voice state for their
     * current role at the current game state.
     *
     * @param guild the guild in which to perform the voice state update
     * @param memberId the id of the member to update voice state for
     */
    async ensureGuildMemberVoiceState(memberId: string) {
        await LoadRoles();

        let roleName: string;
        if (this.game.alivePlayerIds.includes(memberId)) {
            roleName = "Alive";
        } else if (this.game.deadPlayerIds.includes(memberId)) {
            roleName = "Dead";
        } else {
            roleName = "Spectator";
        }

        const role = GetRole(roleName);
        if (!role) {
            throw `Unable to find role '${role}'`;
        }

        if (this.game.state === "created" || this.game.state === "ended") {
            await this.guild.members.edit(memberId, {deaf: false, mute: false});
            return;
        }

        const expectedState = await role.getExpectedVoiceState(this.game.state);
        await this.guild.members.edit(memberId, expectedState);
    }
}

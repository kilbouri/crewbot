import {
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Guild,
    MessageActionRowComponentBuilder,
    MessageComponentInteraction,
    StringSelectMenuBuilder,
    userMention,
} from "discord.js";
import {ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";
import {ActionRowBuilder} from "@discordjs/builders";

const playerDiedButton: ButtonType = {
    buttonId: "playerDied",
    execute: async (intr, channelId: string) => {
        if (!intr.inGuild()) {
            return;
        }

        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        await intr.deferReply({ephemeral: true});

        const guild = await intr.client.guilds.fetch(intr.guildId);
        const alivePlayers = await coordinator.getAlivePlayers();
        const guildMembers = await Promise.all(alivePlayers.map((id) => getUser(guild, id)));

        // have the user select who died
        const selectionBoxRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new StringSelectMenuBuilder()
                .setPlaceholder("Who died?")
                .setCustomId("deadPlayer")
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(guildMembers.map((member) => ({value: member.id, label: member.displayName})))
        );

        const selectionReply = await intr.editReply({content: "Who died?", components: [selectionBoxRow]});
        const [deadUserId, selectionInteraction] = await catchTimeout(async () => {
            const selected = await selectionReply.awaitMessageComponent({
                time: 60 * 1000,
                componentType: ComponentType.StringSelect,
                dispose: true,
                filter: (e) => e.customId === "deadPlayer",
            });

            if (selected.values.length === 0) {
                return [];
            }

            // [result, interaction]
            return [selected.values[0], selected];
        }, []);

        if (!deadUserId || !selectionInteraction) {
            await intr.editReply("No response in 60 seconds. Guess nobody died. That's good, right?");
            return;
        }

        // confirm the user selected the right corpse
        const confirmButtonId = "confirmDelete";
        const cancelButtonId = "cancelDelete";
        const confirmActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder() //
                .setLabel("Yes, I'm Sure")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(confirmButtonId),
            new ButtonBuilder() //
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(cancelButtonId)
        );

        const confirmationMessage = await selectionInteraction.update({
            content: "Are you sure " + userMention(deadUserId) + " is dead?",
            components: [confirmActionRow],
        });

        const confirmation = await catchTimeout(async () => {
            const response = await confirmationMessage.awaitMessageComponent({
                time: 60 * 1000,
                dispose: true,
                componentType: ComponentType.Button,
            });

            return response.customId === confirmButtonId;
        }, undefined);

        if (confirmation === undefined) {
            await intr.update(
                "No response in 60 seconds. Guess " + userMention(deadUserId) + " didn't die. That's good, right?"
            );
            return;
        }

        await coordinator.playerDied(deadUserId);
        await intr.deleteReply();
    },
};

const getUser = async (guild: Guild, userId: string) => {
    return guild.members.cache.get(userId) ?? (await guild.members.fetch(userId));
};

const catchTimeout = async <T, E>(promise: () => Promise<T>, timeoutValue: E): Promise<T | E> => {
    try {
        return await promise();
    } catch {
        return timeoutValue;
    }
};

export {playerDiedButton as button};

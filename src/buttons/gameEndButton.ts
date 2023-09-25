import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
} from "discord.js";
import {ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const gameEndedButton: ButtonType = {
    buttonId: "gameEnded",
    execute: async (initialIntr, channelId: string) => {
        // Replace the embed with one indicating the game has ended
        const embed = new EmbedBuilder()
            .setTitle("Game Ended")
            .setDescription("This game of Among Us has ended. Use `/newgame` to create a new one!");

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

        const coordinator = await GameCoordinator.forChannel(channelId);
        if (!coordinator) {
            return;
        }

        const confirmationMessage = await initialIntr.reply({
            content: "Are you sure you want to end this game?",
            components: [confirmActionRow],
            ephemeral: true,
        });

        try {
            const buttonResponse = await confirmationMessage.awaitMessageComponent({
                componentType: ComponentType.Button,
                filter: (buttonIntr) => [confirmButtonId, cancelButtonId].includes(buttonIntr.customId),
                time: 30 * 1000, // 30 seconds
            });

            if (buttonResponse.customId === confirmButtonId) {
                await coordinator.endGame();

                // ensure the channel is in cache
                await initialIntr.client.channels.fetch(initialIntr.message.channelId);

                // fetch the game control panel, and edit it
                const controlPanelMessage = await initialIntr.message.fetch();
                await controlPanelMessage.edit({embeds: [embed], components: []});
            }

            await initialIntr.deleteReply();
        } catch (e) {
            await initialIntr.editReply({
                content: "Confirmation not received within 30 seconds. The game has not been ended.",
                components: [],
            });
        }
    },
};

export {gameEndedButton as button};

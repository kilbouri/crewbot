import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageActionRowComponentBuilder,
} from "discord.js";
import {ButtonType} from ".";
import {GameCoordinator} from "../gameCoordinator";

const gameEndedButton: ButtonType = {
    buttonId: "gameEnded",
    execute: async (initialIntr, channelId: string) => {
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

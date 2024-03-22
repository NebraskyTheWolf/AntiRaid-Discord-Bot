import BaseModal from "@fluffici.ts/components/BaseModal";
import BaseEvent from "@fluffici.ts/components/BaseEvent";

import { ModalSubmitInteraction } from "discord-modals";

export default class ModalSubmit extends BaseEvent {
    public constructor() {
        super("modalSubmit", async (interaction: ModalSubmitInteraction) => {
            if (interaction.customId === undefined) await interaction.reply({
              content: "Modal can't have a empty 'customId'.",
              ephemeral: true
            });

            try {
                const handler: BaseModal = this.instance.modalManager.getModal(interaction.customId);
                if (!handler) return await interaction.reply({
                    content: "The modal '" + interaction.customId + "' is not found.",
                    ephemeral: true
                });

                return handler.handler(interaction);
            } catch (err) {
                this.instance.logger.error(`ModalEvent(${interaction.customId}): ${err}`);
                return await interaction.reply({
                    content: "A error occurred during the Modal execution.",
                    ephemeral: true
                });
            }
        });
    }
}

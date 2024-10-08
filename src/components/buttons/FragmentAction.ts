import BaseButton from "@fluffici.ts/components/BaseButton";

import { ButtonInteraction, MessageButton, MessageEmbed } from "discord.js";

export default class FragmentAction extends BaseButton<MessageButton, void> {

    private readonly custom_id: string;

    public constructor(label: string, custom_id: string) {
        super(`row_action_${custom_id}`, label);

        this.custom_id = custom_id;
    }

    public handler(interaction: ButtonInteraction<"cached">): Promise<void> { return }

    public generate(): MessageButton {
        return new MessageButton()
            .setLabel(this.description)
            .setStyle("PRIMARY")
            .setCustomId(this.custom_id);
    }

    public message(): MessageEmbed {
        return null;
    }
}

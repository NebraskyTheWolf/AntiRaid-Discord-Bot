import BaseButton from "@fluffici.ts/components/BaseButton";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { ButtonInteraction, MessageButton, MessageEmbed } from "discord.js";

export default class Fragment extends BaseButton<MessageButton, void> {

    private readonly link: string;

    public constructor(label: string, link: string) {
        super("row_temporary", label, new OptionMap<string, unknown>());

        this.link = link;
    }

    public handler(interaction: ButtonInteraction<"cached">): Promise<void> { return }

    public generate(): MessageButton {
        return new MessageButton()
            .setLabel(this.description)
            .setStyle("LINK")
            .setURL(this.link);
    }

    public message(): MessageEmbed {
        return null;
    }
}

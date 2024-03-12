import BaseCommand from "@fluffici.ts/components/BaseCommand";
import BaseButton from "@fluffici.ts/components/BaseButton";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction, MessageButton, } from "discord.js";
import { SlashCommandStringOption } from "@discordjs/builders";

export default class CommandSpawnButton extends BaseCommand {
    public constructor() {
        super("spawn", "Summoning a button.", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );

        this.addStringOption(
            new SlashCommandStringOption()
                .setName("buttonid")
                .setDescription("Select the button")
                .setRequired(true)
        );
    }

    async handler(inter: CommandInteraction, member: GuildMember, guild: Guild) {
        const buttonId: string = inter.options.getString("buttonid");
        const handler: BaseButton<unknown, unknown> = this.instance.buttonManager.getButton(buttonId);
        if (!(handler instanceof BaseButton))
            await inter.reply({
              content: 'Failed to summon ' + buttonId + ', Because it\'s not a button.',
              ephemeral: true
            });

        if (!handler) {
            await inter.reply({
              content: 'Failed to summon ' + buttonId,
              ephemeral: true
            });
        } else {
            await inter.reply({
              "components": [
                {
                  "type": 1,
                  "components": [handler.generate() as MessageButton]
                }
              ],
              embeds: [handler.message()]
            });
        }
    }
}

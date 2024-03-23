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
        const buttonHandler: BaseButton<unknown, unknown> = this.instance.buttonManager.getButton(buttonId);

        const replyMessageOnFailure = async (message: string) => {
            await inter.reply({
                content: message,
                ephemeral: true
            });
        };

        if (!(buttonHandler instanceof BaseButton)) {
            await replyMessageOnFailure(`Failed to summon ${buttonId}, Because it's not a button.`);
        }

        if (!buttonHandler) {
            await replyMessageOnFailure(`Failed to summon ${buttonId}`);
        } else {
            if (buttonId == "row_verify") {

              const support = this.instance.buttonManager.getButton("row_support_ticket")

              inter.channel.send({
                components: [
                  {
                    type: 1,
                    components: [
                      buttonHandler.generate() as MessageButton,
                      support.generate() as MessageButton
                    ]
                  }
                ],
                embeds: [buttonHandler.message()]
              })

              await inter.reply({
                content: 'Interaction summoned.',
                ephemeral: false
              });
            } else {
              await inter.reply({
                components: [
                  {
                    type: 1,
                    components: [buttonHandler.generate() as MessageButton]
                  }
                ],
                embeds: [buttonHandler.message()]
              });
            }
        }
    }
}

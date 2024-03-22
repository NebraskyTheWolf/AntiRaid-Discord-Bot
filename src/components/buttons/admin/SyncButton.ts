import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, CommandInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import {fetchMember} from "@fluffici.ts/types";
import LocalBlacklist from "@fluffici.ts/database/Common/LocalBlacklist";
import {registerCommands} from "@fluffici.ts/utils/registerCommand";

export default class SyncButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_sync', 'Confirm')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    const guild = await this.getGuild(interaction.guildId)

    await registerCommands(
      this.instance,
      interaction.guildId,
      interaction.guild.name,
      this.instance.manager
    );

    await interaction.reply({
      content: 'Command map reloaded.'
    });
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.DANGER)
      .setLabel("Sync")
      .setEmoji(this.getEmojisConfig().get('warning'))
      .setCustomId(`row_sync`);
  }

  message(): MessageEmbed {
    return new MessageEmbed(this.buildEmbedBody({
      icon: 'warning',
      title: 'Are you sure?',
      description: 'If you continue you will reload the entire command map for this server.',
      fields: []
    }));
  }
}

import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ConfirmButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_confirm', 'Confirm', new OptionMap<string, any>())
  }


  handler(interaction: ButtonInteraction<"cached">): Promise<void> {
    const guild = this.getGuild(interaction.guildId)

    return Promise.resolve(undefined);
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.DANGER)
      .setLabel("Confirm")
      .setEmoji(this.getEmojisConfig().get('ban'))
      .setCustomId(`row_confirm_button`);
  }

  message(): MessageEmbed {
    return new MessageEmbed(this.buildEmbedBody({
      icon: 'warning',
      title: this.getLanguageManager().translate('common.button.confirm.title'),
      description: this.getLanguageManager().translate('common.button.confirm.description'),
      fields: []
    }));
  }

}

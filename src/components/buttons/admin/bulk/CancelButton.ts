import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, CommandInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import {fetchMember} from "@fluffici.ts/types";
import LocalBlacklist from "@fluffici.ts/database/Common/LocalBlacklist";
import RaidSession from "@fluffici.ts/database/Security/RaidSession";

export default class CancelButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_cancel_bulk_blacklist', 'Cancel')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    const guild = await this.getGuild(interaction.guildId)

    const session: string = this.arguments.get('sessionId')

    if (!session) {
      return await this.respond(interaction, 'command.blacklist.bulk.blacklist.session_not_found', 'command.blacklist.bulk.blacklist.session_not_found.desc', 'RED')
    }

    const members = await RaidSession.find({ session: session })

    if (!members) {
      return await this.respond(interaction, 'command.blacklist.bulk.blacklist.session_not_found', 'command.blacklist.bulk.blacklist.session_not_found.desc', 'RED')
    }

    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return await this.respond(interaction, 'common.button.not_owned', 'common.button.not_owned.desc', 'RED', {}, 'error')
    }
    members.forEach(async m => {
      let member = await fetchMember(guild.guildID, m.userId)
      if (member) {
        if (member.isCommunicationDisabled()) {
          member.timeout(60 * 1000, "Removed temporary timeout")
        }
      }

      await RaidSession.deleteOne({ _id: m._id})
    })

    return await this.respond(interaction, 'command.blacklist.bulk.blacklist.cancelled', 'command.blacklist.bulk.blacklist.cancelled.desc', 'GREEN')
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.SUCCESS)
      .setLabel("Cancel")
      .setEmoji(this.getEmojisConfig().get('warning'))
      .setCustomId(`row_cancel_bulk_blacklist`);
  }

  message(): MessageEmbed {
    return new MessageEmbed(this.buildEmbedBody({}));
  }

  async respond (inter: ButtonInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
    await inter.reply({
      embeds: this.buildEmbedMessage(inter.member, {
        icon: icon,
        color: color,
        title: this.getLanguageManager().translate(titleKey, args),
        description: this.getLanguageManager().translate(descKey, args)
      }),
      ephemeral: true
    })
  }
}

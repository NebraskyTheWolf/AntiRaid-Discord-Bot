import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import {fetchMember} from "@fluffici.ts/types";
import RaidSession from "@fluffici.ts/database/Security/RaidSession";
import Reminder from "@fluffici.ts/database/Security/Reminder";

export default class CancelButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_confirm_bulk_kick', 'Kick all')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    const guild = await this.getGuild(interaction.guildId)


    const members = await Reminder.find({ locked: true, notified: true })

    if (!members) {
      return await this.respond(interaction, 'command.blacklist.bulk.blacklist.session_not_found', 'command.blacklist.bulk.blacklist.session_not_found.desc', 'RED')
    }
    members.forEach(async m => {
      let member = await fetchMember(guild.guildID, m.memberId)
      if (member) {
        member.kick("Verification timed out.")
      }

      await RaidSession.deleteOne({ _id: m._id})
    })

    return await this.respond(interaction, 'command.verification.bulk.kick', 'command.verification.bulk.kick.desc', 'GREEN')
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.SECONDARY)
      .setLabel("Kick all")
      .setEmoji(this.getEmojisConfig().get('warning'))
      .setCustomId(this.customId);
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

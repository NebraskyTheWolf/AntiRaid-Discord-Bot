import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import {fetchMember} from "@fluffici.ts/types";
import RaidSession from "@fluffici.ts/database/Security/RaidSession";

export default class ConfirmBulkBlacklist extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_confirm_bulk_blacklist', 'Confirm')
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
    members.forEach(async m => {
      let member = await fetchMember(guild.guildID, m.userId)

      new Blacklist({
        userID: m.userId,
        reason: 'Raider',
        staffID: interaction.member.id,
        staffName: interaction.member.displayName,
        date: Date.now()
      }).save()

      if (member) {
        await member.ban({ reason: 'Raider' });
      }
    })

    return await this.respond(interaction, 'command.blacklist.bulk.blacklist.success', 'command.blacklist.bulk.blacklist.success.desc', 'GREEN')
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.DANGER)
      .setLabel("Blacklist all")
      .setEmoji(this.getEmojisConfig().get('warning'))
      .setCustomId(`row_confirm`);
  }

  message(): MessageEmbed {
    return new MessageEmbed(this.buildEmbedBody({
      icon: 'warning',
      title: 'Are you sure?',
      description: 'If you continue you will remove the blacklist all the users in the list above.',
      fields: []
    }));
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

import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, GuildMember, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import {fetchMember, fetchSyncMember} from "@fluffici.ts/types";
import RaidSession from "@fluffici.ts/database/Security/RaidSession";
import Reminder from "@fluffici.ts/database/Security/Reminder";

export default class RemindButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_confirm_bulk_remind', 'Remind all')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    const guild = await this.getGuild(interaction.guildId)


    const members = await Reminder.find({ locked: true, notified: true })

    if (!members) {
      return await this.respond(interaction, 'command.blacklist.bulk.blacklist.session_not_found', 'command.blacklist.bulk.blacklist.session_not_found.desc', 'RED')
    }
    members.forEach(async m => {
      let member = fetchSyncMember(guild.guildID, m.memberId)
      if (member) {
        this.sendFirstReminder(member)
      }

      await Reminder.deleteOne({ _id: m._id})
    })

    return await this.respond(interaction, 'command.verification.bulk.remind', 'command.verification.bulk.remind.desc', 'GREEN')
  }

  async sendFirstReminder(member: GuildMember) {
    await member.send({
      embeds: [
        {
          title: `Připomenutí ověření.`,
          description: `
            Zdravíme tě, <:FoxBlanket:1108033370329448458>!⏰ Uběhlo **${new Date(member.joinedTimestamp).getHours()} hodin** od doby, co ses prvně připojil/a/i na server. Aby se ti server odemknul, musíš se prvně ověřit.\n\n
            Rádi bychom tě upozornili, že máš 48 hodin na to dokončit proces ověření než budeš automaticky odebrán ze serveru. A to by byla škoda, nu? 🦊🦊🦊\n\n
            Nemáš se čeho bát - ověření je jednoduché a zabere ti pár minut. To ti slibujeme. K ověření se dostaneš pomocí tlačítka u této zprávy. \n\n
            Děkujeme!
          `,
          footer: {
            text: "FurRaidDB",
            iconURL: this.instance.user.avatarURL({ format: 'png' })
          },
          timestamp: Date.now()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton("Ověřit nyní", "https://discord.com/channels/606534136806637589/1220790179749560320")
          ]
        }
      ]
    })
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.SECONDARY)
      .setLabel("Remind again")
      .setEmoji(this.getEmojisConfig().get('gchecks'))
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

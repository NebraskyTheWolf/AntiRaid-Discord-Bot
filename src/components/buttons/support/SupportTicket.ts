import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import PreventTicket from "@fluffici.ts/database/Security/PreventTicket";

export default class SupportTicket extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_support_ticket', 'Ticket')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    await this.getGuild(interaction.guildId)

    const categoryChannel = interaction.guild.channels.cache.get('1220762011760328725') as TextChannel;

    const currentTicket = await Ticket.findOne({
      userId: interaction.user.id,
      isClosed: false
    })

    const prevented = await PreventTicket.findOne({
      userId: interaction.user.id
    })

    if (prevented) {
      return await interaction.reply({
        content: this.getLanguageManager().translate("ticket.blocked"),
        ephemeral: true
      })
    }

    if (currentTicket) {
        await interaction.reply({
          content: this.getLanguageManager().translate("ticket.already.exist"),
          components: [
            {
              type: 1,
              components: [
                this.instance.buttonManager.createLinkButton(this.getLanguageManager().translate("ticket.already.channel"), `https://discord.com/channels/606534136806637589/${currentTicket.channelId}`)
              ]
            }
          ],
          ephemeral: true
        })
    } else {
      let channelId = ""
      interaction.guild.channels.create(`${interaction.user.tag}-ticket`, {
        type: "GUILD_TEXT",
        parent: categoryChannel.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          },
          {
            id: interaction.user.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          },
        ]
      }).then(async channel => {
        new Ticket({
          channelId: channel.id,
          userId: interaction.user.id
        }).save()

        channelId = channel.id
      })

      await interaction.reply({
        content: this.getLanguageManager().translate("ticket.created"),
        components: [
          {
            type: 1,
            components: [
              this.instance.buttonManager.createLinkButton(this.getLanguageManager().translate("ticket.already.channel"), `https://discord.com/channels/606534136806637589/${channelId}`)
            ]
          }
        ],
        ephemeral: true
      })
    }
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.PRIMARY)
      .setLabel(this.description)
      .setEmoji(this.getEmojisConfig().get('winfo'))
      .setCustomId(this.customId);
  }

  message(): MessageEmbed {
    return new MessageEmbed();
  }
}

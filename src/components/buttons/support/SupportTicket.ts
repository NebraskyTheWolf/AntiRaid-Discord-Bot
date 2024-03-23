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
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES'],
          },
          {
            id: interaction.guild.roles.cache.get("606535408117088277").id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
          },
          {
            id: interaction.guild.roles.cache.get("606540681867034634").id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
          },
          {
            id: interaction.guild.roles.cache.get("782578470135660585").id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
          },
          {
            id: interaction.guild.roles.cache.get("606540994909044756").id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
          },
          {
            id: interaction.guild.roles.cache.get("943216911980822569").id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
          }
        ],
        reason: `${interaction.user.tag} ticket channel`,
        nsfw: false
      }).then(async channel => {
        new Ticket({
          channelId: channel.id,
          userId: interaction.user.id
        }).save()
        const closeButton = this.instance.buttonManager.getButton("row_support_ticket_close")
        channel.sendTyping().then(() => setTimeout(async () => {
          await channel.send({
            embeds: [
              {
                title: 'FurRaidDB - Ticket created.',
                description: `Hello ${interaction.user.username}, You created a new ticket. Type in your issue and staff will be with you soon.`,
                timestamp: Date.now(),
                provider: { name: 'FurRaidDB', url: 'https://fluffici.eu' }
              },
              {
                title: 'FurRaidDB - Ticket rules.',
                description: `
                \u2022 **Provide Detailed Information**: The more specific the information provided, the more quickly and effectively the support team can address your issue. This includes steps you took before encountering the problem, any specific error messages you've seen, and what you've tried already to resolve the issue.\n\n
                \u2022 **Be Clear and Concise**: Clearly describe the problem you're experiencing. Avoid using jargon or non-specific terms such as "it's not working".\n\n
                \u2022 **Use Relevant Subject Lines**: The subject line should briefly summarize the issue. This helps the support team prioritize and categorize your ticket.\n\n
                \u2022 **One Issue Per Ticket**: If you have multiple issues, it's better to submit separate tickets for each one. This allows each problem to be addressed individually and prevents any potential confusion.\n\n
                \u2022 **Include Any Necessary Attachments**: If you have screenshots or logs that illustrate the issue you're facing, include them with your initial submission.\n\n
                \u2022 **Stay Patient and Respectful**: Remember, the support team is there to help you. It's important to treat them with respect and remember that some issues may take time to resolve.\n\n
                \u2022 **Follow Up Appropriately**: If you've not heard back within the expected timeframe, it's okay to follow up on your support ticket. However, multiple messages in a short period can often slowdown the support process.`,
                timestamp: Date.now(),
                provider: { name: 'FurRaidDB', url: 'https://fluffici.eu' }
              }
            ],
            components: [
              {
                type: 1,
                components: [
                  closeButton.generate() as MessageButton
                ]
              }
            ]
          })
        }, 2000))

        channelId = channel.id
      })

      await interaction.reply({
        content: this.getLanguageManager().translate("ticket.created"),
        components: [
          {
            type: 1,
            components: [
              this.instance.buttonManager.createLinkButton(this.getLanguageManager().translate("ticket.already.channel"), `https://discord.com/channels/606534136806637589/` + channelId)
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

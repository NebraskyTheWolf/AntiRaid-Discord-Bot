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
      let channelId: string
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
                title: 'FurRaidDB - Nový ticket',
                description: `
                ${this.getEmojisConfig().get('line').repeat(20)}
                \u2022 **Právě jsi vytvořil nový ticket**: Popiš prosím podrobně, s čím máš problém a náš moderátorský tým se ti bude co nejdříve věnovat. Prosíme o trpělivost.\n\n
                \u2022 **Note for foreign speakers**: This server's primary language is Czech / Slovakian. Although you can join as an English speaker, please note that communication across all of the chats should be in CZ / SK language.\n\n`,
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
        }, 5000))

        channelId = channel.id
      }).finally(async () => {
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

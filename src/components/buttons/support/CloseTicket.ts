import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";
import fs from "fs";
import path from "path";
import {fetchMember, fetchSyncMember} from "@fluffici.ts/types";

export default class CloseTicket extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_support_ticket_close', 'Close ticket')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    await this.getGuild(interaction.guildId)

    const currentTicket = await Ticket.findOne({
      channelId: interaction.channelId,
      isClosed: false
    })

    if (currentTicket) {
      let contentArray = [];
      let userInTranscript = [];
      const messages = await TicketMessage.find({
        ticketId: currentTicket._id
      })

      let uniqueUserIds = new Set(messages.map(data => data.userId));
      let memberFetchPromises = Array.from(uniqueUserIds).map(userId => fetchMember(interaction.guildId, userId));
      let members = await Promise.all(memberFetchPromises);

      contentArray.push(`Users in transcript : `)
      members.forEach(members => {
        let i = 0;
        userInTranscript.push(`${i++} - <@${members.user.id}> - ${members.user.tag}`)
        contentArray.push(`${i++} - <@${members.user.id}> - ${members.user.tag}`)
      })
      contentArray.push('---\n')

      contentArray.push(`Messages : \n`)
      messages.forEach(data => {
        let member = fetchSyncMember(interaction.guildId, data.userId)
        contentArray.push(`Sent at : ${new Date(data.createdAt).toLocaleString()}`);
        contentArray.push(`Author : ${member.user.tag}`);
        contentArray.push(`Message : ${data.message}\n`);
      })
      contentArray.push('---\n')

      const ticketOwner = fetchSyncMember(interaction.guildId, currentTicket.userId)

      try {
        if (contentArray.length > 0) {
          const filePath = path.join(__dirname, '..', '..', '..', '..', 'data', 'transcripts', `transcript-${currentTicket._id}.txt`);
          // Write transcription data to a .txt file
          fs.writeFile(filePath, contentArray.join('\n'), async (err) => {
            if (err) {
              console.error(err)
            } else {
              const uploadChannel = this.instance.channels.cache.get('606614204576825348') as TextChannel;
              await uploadChannel.send({
                embeds: [
                  {
                    color: 'RED',
                    author: {
                      name: interaction.user.tag,
                      iconURL: interaction.user.avatarURL({ format: 'png' })
                    },
                    fields: [
                      {
                        name: 'Ticket Owner',
                        value: `<@${ticketOwner.user.id}>`,
                        inline: true
                      },
                      {
                        name: 'Ticket Name',
                        value: `${interaction.channel.name}`,
                        inline: true
                      },
                      {
                        name: 'Panel Name',
                        value: `${interaction.channel.parent.name}`,
                        inline: true
                      },
                      {
                        name: 'Direct Transcript',
                        value: `Use button`,
                        inline: true
                      },
                      {
                        name: 'Users in transcript',
                        value: `${userInTranscript.join('\n')}`,
                        inline: true
                      }
                    ],
                    footer: {
                      text: `Ticket ${currentTicket._id}`,
                      iconURL: this.instance.user.avatarURL({ format: 'png' })
                    },
                    timestamp: Date.now()
                  }
                ],
                components: [
                  {
                    type: 1,
                    components: [
                      this.instance.buttonManager.createLinkButton(`Archived channel`, `https://discord.com/channels/606534136806637589/${interaction.channel.id}`),
                      this.instance.buttonManager.createLinkButton(`transcript-${currentTicket._id}.txt`, `https://frdbapi.fluffici.eu/api/transcripts/${currentTicket._id}`)
                    ]
                  }
                ]
              });
            }
          });
        }
      } catch (e) {
        this.instance.logger.error(`Failed to transcript ${currentTicket._id} ticket's messages.`)
        this.instance.logger.error(e)
      }

      await currentTicket.updateOne({ isClosed: true });

      await interaction.channel.edit({
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          },
          {
            id: currentTicket.userId,
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES'],
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
        name: `${interaction.channel.name}-closed`
      })
      await interaction.reply({
        content: 'Ticket closed.',
        ephemeral: true
      })
    } else {
      await interaction.reply({
        content: 'This is not a support ticket.',
        ephemeral: true
      })
    }
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.PRIMARY)
      .setLabel(this.description)
      .setEmoji(this.getEmojisConfig().get('close'))
      .setCustomId(this.customId);
  }

  message(): MessageEmbed {
    return new MessageEmbed();
  }
}

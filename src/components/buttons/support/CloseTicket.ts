import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";
import fs from "fs";
import path from "path";
import {fetchMember, fetchSyncMember, fetchSyncUser, fetchUser} from "@fluffici.ts/types";
import ticket from "@fluffici.ts/database/Guild/Ticket";

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
      let memberFetchPromises = Array.from(uniqueUserIds).map(userId => fetchUser(userId));
      let members = await Promise.all(memberFetchPromises);

      members.forEach(members => {
        userInTranscript.push(`<@${members.id}> - ${members.tag}`)
        contentArray.push(`<p><i class="fas fa-user"></i> ${members.tag}</p>`)
      })

      let messagePromises = messages.map(async m => {
        let user = await fetchUser(m.userId);
        const userRegex = /<@(\d{16,19})>/g;
        m.message = m.message.replace(userRegex, (match, userId) => {
          const user = this.instance.users.cache.get(userId);
          return user ? `<strong class='discord-mention'>@${user.tag}</strong>` : match;
        });

        const channelRegex = /<#(\d{16,19})>/g;
        m.message = m.message.replace(channelRegex, (match, channelId) => {
          const channel = this.instance.channels.cache.get(channelId) as TextChannel;
          return channel ? `<strong style="color: orange;">#${channel.name}</strong>` : match;
        });

        const emojiRegex = /<:([a-zA-Z0-9_]+):(\d{16,19})>/g;
        m.message = m.message.replace(emojiRegex, (match, emojiName, emojiId) => {
          const emoji = this.instance.emojis.cache.get(emojiId);
          return emoji ? `<img src="${emoji.url}" class="emoji" alt="${emojiName}">` : match;
        });

        return `<div>
            <div class="message-header">
                <img class="avatar" src="${ user.avatarURL({ format: 'png' })}" alt="${user.id}">
                <div>
                    <p><i class="fas fa-id-badge"></i> <strong>User ID:</strong> ${user.id}</p>
                    <p><i class="fas fa-user"></i> <strong>Username:</strong> ${user.tag}</p>
                    <p><i class="far fa-calendar"></i> <strong>Date:</strong> ${new Date(m.createdAt).toDateString()}</p>
                </div>

            </div>
            <div class="message-content">
                <p>${m.message}</p>
            </div>
        </div>

        <hr class="message-separator">`;
      });

      let messageSimplePromises = messages.map(x => {
        return x.message
      })

      let messageResults = await Promise.all(messagePromises);

      const ticketOwner = await fetchMember(interaction.guildId, currentTicket.userId)

      try {
        if (contentArray.length > 0) {
          const filePath = path.join(__dirname, '..', '..', '..', '..', 'data', 'transcripts', `transcript-${currentTicket._id}.html`);
          // Write transcription data to a .txt file

          this.replacePlaceholdersInFile(filePath, {
            owner: ticketOwner.displayName,
            ticketid: currentTicket._id,
            opened: "NYI",
            closed: new Date().toDateString(),
            channel: interaction.channel.name,
            users: contentArray.join("\n"),
            messages: messageResults.join("\n")
          }, messageSimplePromises)

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
                    name: 'Users in transcript_files',
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
                  this.instance.buttonManager.createLinkButton(`transcript-${currentTicket._id}.html`, `https://frdbapi.fluffici.eu/api/transcripts/${currentTicket._id}`)
                ]
              }
            ]
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
        name: `${interaction.channel.name}-closed`,
        parent: '1231669552249835581'
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

    const button = interaction.message.components[0].components[0]
    button.disabled = true

    await interaction.message.edit({
      embeds: interaction.message.embeds,
      components: [
        {
          type: 1,
          components: [
            button
          ]
        }
      ]
    })
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

  replacePlaceholdersInFile(filePath: string, replacements: Record<string, string>, messages: string[]): void {
    // Read the file
    fs.readFile(path.join(__dirname, '..', '..', '..', '..', 'transcript_files', `index.html`), 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err}`);
        return;
      }

      // Perform replacements
      let modifiedContent = data;
      Object.entries(replacements).forEach(([placeholder, value]) => {
        const regex = new RegExp(`%${placeholder}%`, 'g');
        modifiedContent = modifiedContent.replace(regex, value);
      });

      // Write the modified content back to the file
      fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing to file: ${err}`);
          return;
        }
        console.log('Replacements complete.');
      });
    });
  }
}

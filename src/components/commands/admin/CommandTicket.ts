import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import {CommandInteraction, Guild, GuildMember, MessageButton, TextChannel, User} from 'discord.js'
import {
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder, SlashCommandUserOption,
} from "@discordjs/builders";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import guild from "@fluffici.ts/database/Guild/Guild";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";
import {fetchMember, fetchUser} from "@fluffici.ts/types";
import path from "path";
import fs from "fs";

export default class CommandTicket extends BaseCommand {

  public constructor() {
    super("ticket", "This command will let you manage the support tickets.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", false),
      "ADMINISTRATOR"
    );

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("close")
        .setDescription("Closing a ticket")
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("transcripts")
        .setDescription("Transcript")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("id")
            .setDescription("Transcript one old support ticket")
            .setRequired(true)
        )
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("create")
        .setDescription("Creating a ticket for a member")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select the user")
            .setRequired(true)
        )
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add someone to a existing channel.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select the user")
            .setRequired(true)
        )
    )
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const command = inter.options.getSubcommand()

    if (inter.guildId != '606534136806637589') {
      await inter.reply({
        content: `Sorry, but this feature is restricted.`,
        ephemeral: true
      });
      return;
    }

    if (command == "create") {
      const currentTicket = await Ticket.findOne({
        channelId: inter.channelId,
        isClosed: false
      })

      if (!currentTicket) {
        const user = inter.options.getUser("user", true);

        if (user) {
          const existingTicket = await Ticket.findOne({
            userId: user.id,
            isClosed: false
          });

          if (existingTicket) {
            await inter.reply({
              content: `The user already has an open ticket. Please close their current ticket before creating a new one.`,
              ephemeral: true
            });
            return;
          }

          let channelId: string
          inter.guild.channels.create(`${user.tag}-ticket`, {
            type: "GUILD_TEXT",
            parent: '1220762011760328725',
            permissionOverwrites: [
              {
                id: inter.guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
              },
              {
                id: user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES'],
              },
              {
                id: inter.guild.roles.cache.get("606535408117088277").id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
              },
              {
                id: inter.guild.roles.cache.get("606540681867034634").id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
              },
              {
                id: inter.guild.roles.cache.get("782578470135660585").id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
              },
              {
                id: inter.guild.roles.cache.get("606540994909044756").id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
              },
              {
                id: inter.guild.roles.cache.get("943216911980822569").id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'MANAGE_MESSAGES'],
              }
            ],
            reason: `${user.tag} ticket channel`,
            nsfw: false
          }).then(async channel => {
            new Ticket({
              channelId: channel.id,
              userId: user.id
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
            await inter.reply({
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

          await inter.reply({
            content: `Ticket created for <@${user.id}>.`,
            ephemeral: true
          });
        } else {
          await inter.reply({
            content: `Please provide a valid user.`,
            ephemeral: true
          });
        }
      } else {
        await inter.reply({
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
      }
    } else if (command == "close") {
      const currentTicket = await Ticket.findOne({
        channelId: inter.channelId,
        isClosed: false
      })

      if (currentTicket) {
        const ticketChannel = guild.channels.cache.get(currentTicket.channelId);
        ticketChannel.delete()
        await currentTicket.updateOne({ isClosed: true });

        await inter.reply({
          content: `<@${currentTicket.userId}> is now closed.`,
          ephemeral: true
        })
      } else {
        await inter.reply({
          content: `This channel is not a support ticket.`,
          ephemeral: true
        })
      }
    } else if (command == "transcripts") {
      let ticketId = inter.options.getString("id", true)

      const currentTicket = await Ticket.findOne({ _id: ticketId })

      const messages = await TicketMessage.find({
        ticketId: ticketId
      })

      if (messages) {
        let contentArray = [];

        let uniqueUserIds = new Set(messages.map(data => data.userId));
        let memberFetchPromises = Array.from(uniqueUserIds).map(userId => fetchUser(userId));
        let members = await Promise.all(memberFetchPromises);

        members.forEach(members => {
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
            return emoji ? `<img src="${emoji.url}" class="emoji" alt="${emojiName}" width="64" height="64">` : match;
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
        const ticketOwner = await fetchMember(inter.guildId, currentTicket.userId)

        const filePath = path.join(__dirname, '..', '..', '..', '..', 'data', 'transcripts', `transcript-${currentTicket._id}.html`);
        // Write transcription data to a .txt file

        this.replacePlaceholdersInFile(filePath, {
          owner: ticketOwner.displayName,
          ticketid: currentTicket._id,
          opened: "NYI",
          closed: new Date().toDateString(),
          channel: inter.guild.channels.cache.get(currentTicket.channelId).name || "Deleted Channel.",
          users: contentArray.join("\n"),
          messages: messageResults.join("\n")
        }, messageSimplePromises)

        await inter.reply({
          content: `Transcript generated!`,
          components: [
            {
              type: 1,
              components: [
                this.instance.buttonManager.createLinkButton(`transcript-${currentTicket._id}.html`, `https://frdbapi.fluffici.eu/api/transcripts/${currentTicket._id}`)
              ]
            }
          ],
          ephemeral: false
        })
      } else {
        await inter.reply({
          content: `Invalid ticket ID.`,
          ephemeral: true
        })
      }
    } else if (command == "add") {
      const currentTicket = await Ticket.findOne({
        channelId: inter.channelId,
        isClosed: false
      })

      if (currentTicket) {
        let user = inter.options.getUser("user", true)
        await inter.channel.edit({
          permissionOverwrites: [
            {
              id: user.id,
              allow: ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'VIEW_CHANNEL']
            }
          ]
        })

        await inter.channel.send({
          content: `<@${user.id}>`
        })

        await inter.reply({
          content: `<@${user.id}> has been added to ${inter.channel.name}.`,
          ephemeral: true
        })
      } else {
        await inter.reply({
          content: `This channel is not a support ticket.`,
          ephemeral: true
        })
      }
    }
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

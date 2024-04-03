import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import {CommandInteraction, Guild, GuildMember, MessageButton} from 'discord.js'
import {
  SlashCommandSubcommandBuilder, SlashCommandUserOption,
} from "@discordjs/builders";
import Ticket from "@fluffici.ts/database/Guild/Ticket";

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
        .setName("create")
        .setDescription("Creating a ticket for a member")
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
    }
  }
}

import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import {CommandInteraction, Guild, GuildMember} from 'discord.js'
import {
  SlashCommandSubcommandBuilder,
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
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const currentTicket = await Ticket.findOne({
      channelId: inter.channelId,
      isClosed: false
    })

    if (currentTicket) {
      const ticketChannel = guild.channels.cache.get(currentTicket.channelId);
      ticketChannel.delete()
      await currentTicket.updateOne({ isClosed: true });

      await inter.followUp({
        content: `<@${currentTicket.userId}> is now closed.`,
        ephemeral: true
      })
    } else {
      await inter.followUp({
        content: `This channel is not a support ticket.`,
        ephemeral: true
      })
    }
  }
}

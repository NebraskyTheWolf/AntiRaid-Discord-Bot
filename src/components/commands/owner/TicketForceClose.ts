import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import {GuildMember, Guild, CommandInteraction, User} from "discord.js";
import {SlashCommandUserOption} from "@discordjs/builders";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import {fetchMember} from "@fluffici.ts/types";

export default class TicketForceClose extends BaseCommand {
    public constructor() {
        super("close", "Force closing a vacant ticket", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );

        this.addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select the user")
            .setRequired(true)
        )
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      const user: User = inter.options.getUser("user", true)

      const vacantTicket = await Ticket.findOne({
        userId: user.id,
        isClosed: false
      })

      if (vacantTicket) {
        await vacantTicket.updateOne({
          userId: user.id,
          isClosed: true
        })

        return await inter.reply({
          embeds: this.buildEmbedMessage(await fetchMember(guild.id, user.id), {
            icon: 'close',
            title: 'Success',
            description: `Vacant ticket deleted for ${user.tag}.`,
            fields: [
              {
                name: 'Ticket ID',
                value: vacantTicket._id,
                inline: false
              }
            ]
          })
        })
      } else {
        return await inter.reply({
          embeds: this.buildEmbedMessage(await fetchMember(guild.id, user.id), {
            icon: 'error',
            title: 'Error',
            description: `${user.tag} does not have any vacant ticket.`,
            fields: []
          })
        })
      }
    }
}

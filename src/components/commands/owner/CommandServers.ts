import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandServers extends BaseCommand {

  public constructor() {
    super("servers", "This command will show all the servers that use this application.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", true),
      "DEFAULT"
    );
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    await this.getGuild(guild.id)

    let servers: string;

    this.instance.guilds.cache.each((guild, snowflake) => {
      servers = servers.concat(`> ** ${guild.name} ** - ID: ${guild.id} - Owner: ${ guild.ownerId}\n`)
    })

    await inter.reply({
      content: servers,
      ephemeral: true
    })
  }
}

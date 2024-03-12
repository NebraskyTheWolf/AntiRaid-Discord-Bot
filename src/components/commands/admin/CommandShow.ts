import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandShow extends BaseCommand {

  public constructor() {
    super("show", "This command will show if a user is blacklisted and the details.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", false),
      "DEFAULT"
    );
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    await this.getGuild(guild.id)

  }
}

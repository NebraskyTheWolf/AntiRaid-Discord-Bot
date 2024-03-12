import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandHelp extends BaseCommand {

  public constructor() {
    super("help", "This command will show you the basic usage of the bot.", new OptionMap<string, boolean>()
        .add("dmPermission", false)
        .add("isDeveloper", false),
      "DEFAULT"
    );
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    await this.getGuild(guild.id)
    await inter.reply({
      embeds: this.buildEmbedMessage(member, {
        icon: 'info',
        color: '#720c7e',
        title: this.getLanguageManager().translate('command.help.title', { name: member.displayName }),
        description: this.getLanguageManager().translate('command.help.description')
      }),
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton(this.getLanguageManager()
              .translate('command.common.button.wiki'), this.getDefaultConfig().get("wiki-link")),

            this.instance.buttonManager.createLinkButton(this.getLanguageManager()
              .translate('command.common.button.support'), this.getDefaultConfig().get('discord-support-link'))
          ]
        }
      ],
      ephemeral: true
    })
  }
}

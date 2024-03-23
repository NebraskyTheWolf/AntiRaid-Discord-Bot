import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandSupport extends BaseCommand {
  public constructor() {
    super("support", "Invite to the support discord server.", new OptionMap<string, boolean>()
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
        title: `${this.getLanguageManager().translate('command.support.title')}`,
        description: this.getLanguageManager().translate('command.support.description', { username: member.displayName })
      }),
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton(this
              .getLanguageManager()
              .translate('command.common.button.support'), this.getDefaultConfig().get('bot-invite'))
          ]
        }
      ],
      ephemeral: true
    })
  }
}

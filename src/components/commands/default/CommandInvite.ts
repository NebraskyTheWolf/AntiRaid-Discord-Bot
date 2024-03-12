import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandInvite extends BaseCommand {
  public constructor() {
    super("invite", "Invite the bot on your discord server.", new OptionMap<string, boolean>()
        .add("dmPermission", false)
        .add("isDeveloper", false),
      "DEFAULT"
    );
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    await this.getGuild(guild.id)
    await inter.followUp({
      embeds: this.buildEmbedMessage(member, {
        icon: 'info',
        color: '#720c7e',
        title: `Invite`,
        description: this.getLanguageManager().translate('command.invite.description')
      }),
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton(this
              .getLanguageManager()
              .translate('command.common.button.invite'), 'https://discord.com/api/oauth2/authorize?client_id=803015962223837184&permissions=8&scope=bot')
          ]
        }
      ],
      ephemeral: true
    })
  }
}

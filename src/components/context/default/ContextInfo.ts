import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";

export default class ContextInfo extends BaseContextMenu {

  public constructor() {
    super("FurRaidDB Info", ApplicationCommandType.User, new OptionMap<string, boolean>());
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {
    await this.getRaiderCount().then(async result => {
      await inter.followUp({
        embeds: this.buildEmbedMessage(member, {
          icon: 'info',
          color: 'ORANGE',
          title: 'information',
          fields: [
            {
              name: 'Version',
              value: `${process.env.VERSION}`,
              inline: true
            },
            {
              name: 'Raiders blocked',
              value: `${result}`,
              inline: true
            },
          ]
        }),
        components: [
          {
            type: 1,
            components: [
              this.instance.buttonManager.createLinkButton("Status", "https://status.fluffici.eu"),
              this.instance.buttonManager.createLinkButton("Wiki", this.getDefaultConfig().get('wiki-link')),
              this.instance.buttonManager.createLinkButton("Support Server", this.getDefaultConfig().get('discord-support-link')),
            ]
          }
        ],
        ephemeral: true
      })
    }).catch(async err => {
      await inter.followUp({
        content: 'Sorry, we\'re currently having issues to process your request.',
        ephemeral: true
      })
    })
    return true;
  }
}

import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember, MessageButton} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ContextBlacklistDel extends BaseContextMenu {

  public constructor() {
    super("Remove from blacklist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {
      await this.getGuild(guild.id)
      const confirm = this.instance.buttonManager.getButton('row_confirm')

      confirm.arguments.add('targetId', inter.targetId)
      confirm.arguments.add('ownerId', inter.member.id)

      await inter.followUp({
        embeds: [ confirm.message() ],
        components: [
          {
            type: 1,
            components: [
              confirm.generate() as MessageButton
            ]
          }
        ],
        ephemeral: true
      })
      return false;
  }

}

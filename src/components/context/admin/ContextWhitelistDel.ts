import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {CommandInteraction, ContextMenuInteraction, Guild, GuildMember, User} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import Whitelist from "@fluffici.ts/database/Common/Whitelist";

export default class ContextWhitelistDel extends BaseContextMenu {

  public constructor() {
    super("Remove from whitelist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {
    const user = inter.targetId
    await this.getGuild(guild.id)

    return await this.handleRemoveCommand(inter, member, guild.id, user);
  }

  private generateEmbedsResponse (member: GuildMember, titleKey: string, icon: string, color: string, fields: any, descriptionKey?: string, args?: {}) {
    const title = this.getLanguageManager().translate(titleKey, args)
    const description = this.getLanguageManager().translate(descriptionKey, args)

    return {
      embeds: this.buildEmbedMessage(member, {
        icon,
        title,
        color,
        description,
        fields
      }),
      ephemeral: true
    }
  }

  private async handleRemoveCommand (inter: ContextMenuInteraction<"cached">, member: GuildMember, guildId: string, user: string): Promise<any> {
    try {
      await Whitelist.deleteOne({
        guildID: guildId,
        userID: user,
      })
      this.writeAuditLog(guildId, inter.member.id, "whitelist_removed", `Removed ${user} from the whitelist`)
      await inter.reply(this.generateEmbedsResponse(member, 'command.whitelist.removed_success','success', 'ORANGE', [], 'command.whitelist.removed_success.description'))
    } catch {
      await inter.reply(this.generateEmbedsResponse(member, 'command.whitelist.removed_failed','error', 'RED', [], 'command.whitelist.removed_failed.description'))
    }
  }
}

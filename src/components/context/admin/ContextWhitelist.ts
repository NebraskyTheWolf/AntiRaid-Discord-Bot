import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {getCurrentDate} from "@fluffici.ts/types";
import Whitelist from "@fluffici.ts/database/Common/Whitelist";

export default class ContextWhitelist extends BaseContextMenu {

  public constructor() {
    super("Add to whitelist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild) {
    const user = inter.targetId

    await this.getGuild(guild.id)

    const whitelisted = await Whitelist.findOne({
      guildID: guild.id,
      userID: user
    })

    return await this.handleAddCommand(inter, member, guild.id, user, whitelisted);
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

  private async handleAddCommand (inter: ContextMenuInteraction<"cached">, member: GuildMember, guildId: string, user: string, whitelisted: any): Promise<any> {
    if (whitelisted) {
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.already_whitelisted.title','info', 'ORANGE', [], 'command.whitelist.already_whitelisted.description'))
    }

    try {
      await new Whitelist({
        userID: user,
        staff: member.id,
        guildID: guildId,
        date: getCurrentDate()
      }).save()

      this.writeAuditLog(guildId, inter.member.id, "whitelist_added", `Whitelisted ${user}`)
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.added_success','success', 'ORANGE', [], 'command.whitelist.added_success.description'))
    } catch {
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.added_failed','error', 'RED', [], 'command.whitelist.added_failed.description'))
    }
  }
}

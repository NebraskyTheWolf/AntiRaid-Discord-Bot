import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {CommandInteraction, ContextMenuInteraction, Guild, GuildMember, MessageButton} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";
import Staff from "@fluffici.ts/database/Guild/Staff";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import {fetchMember, getCurrentDate, isBotOrSystem} from "@fluffici.ts/types";
import Blacklist, {IBlacklist as FBlacklist} from "@fluffici.ts/database/Common/Blacklist";
import LocalBlacklist from "@fluffici.ts/database/Common/LocalBlacklist";

export default class ContextBlacklist extends BaseContextMenu {

  public constructor() {
    super("Add to blacklist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<any> {
    const fGuild = await this.getGuild(guild.id)

    const globalBlacklist: FBlacklist = await Blacklist.findOne({ userID: inter.targetId })
    const bMember = await fetchMember(inter.guildId, inter.targetId)

    const staff = await Staff.findOne({ userID: inter.member.id })

    if (!staff) {
      return await this.respond(inter, 'command.blacklist.insufficient_permissions_title', 'command.blacklist.insufficient_permissions_description', 'RED', {}, 'error')
    }

    if (globalBlacklist) {
      return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', {}, 'warning')
    }

    await new Blacklist({
      userID: inter.targetId,
      reason: 'Raider',
      staffID: inter.member.id,
      staffName: inter.member.displayName,
      date: getCurrentDate()
    }).save()

    await this.handleLog(fGuild, inter, inter.targetId, 'add', 'global')
    this.writeAuditLog(fGuild.guildID, inter.member.id, "global_blacklist_added", `Blacklisted ${inter.targetId} reason Raider`)
    await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN')

    await bMember.ban({ reason: 'Raider' })
  }

  async respond (inter: ContextMenuInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
    await inter.followUp({
      embeds: this.buildEmbedMessage(inter.member, {
        icon: icon,
        color: color,
        title: this.getLanguageManager().translate(titleKey, args),
        description: this.getLanguageManager().translate(descKey, args)
      }),
      ephemeral: true
    })
  }

  async handleLog(guild: FGuild, inter: ContextMenuInteraction<'cached'>, user: string, type: string, log: string) {
    await this.sendLog(guild, await fetchMember(guild.guildID, user), (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user),
        await Blacklist.findOne({ userID: user }),
        await LocalBlacklist.findOne({ userID: user, guildID: inter.guildId })
      ));
  }
}

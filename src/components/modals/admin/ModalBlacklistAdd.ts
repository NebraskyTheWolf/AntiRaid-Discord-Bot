import {ModalSubmitInteraction} from "discord-modals";
import BaseModal from "@fluffici.ts/components/BaseModal";
import Staff from "@fluffici.ts/database/Guild/Staff";
import {GuildMember} from "discord.js";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import {fetchMember, getCurrentDate, isBotOrSystem} from "@fluffici.ts/types";
import Blacklist, { IBlacklist } from "@fluffici.ts/database/Common/Blacklist";
import LocalBlacklist, { LocalBlacklist as FLocalBlacklist } from "@fluffici.ts/database/Common/LocalBlacklist";

export default class ModalBlacklistAdd extends BaseModal {

  public constructor() {
    super("row_blacklist_add");
  }

  public async handler(interaction: ModalSubmitInteraction): Promise<void> {
    const userId: string = interaction.getTextInputValue("row_blacklist_add_userid");
    const reason: string = interaction.getTextInputValue("row_blacklist_add_reason");

    const staff = await Staff.findOne({userID: interaction.member.id})
    const [guild, blacklisted, localBlacklist] = await this.fetchRequiredDataUser(interaction.guildId, userId)
    const member = await fetchMember(interaction.guildId, userId)

    if (staff) {
      return await this.handleGlobalBlacklist(interaction, member, guild, reason, blacklisted)
    } else {
      return await this.handleLocalBlacklist(interaction, member, guild, reason, localBlacklist)
    }
  }

  public async handleGlobalBlacklist(inter: ModalSubmitInteraction, member: GuildMember, guild: FGuild, reason: string, globalBlacklist: IBlacklist) {
    if (isBotOrSystem(member)) {
      return await this.respond(inter, 'command.blacklist.cannot_blacklist_bot_title', 'command.blacklist.cannot_blacklist_bot_description', 'RED', {}, 'warning')
    }

    if (globalBlacklist) {
      return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', {}, 'warning')
    }

    if (!member) {
      return await this.respond(inter, 'command.blacklist.user_not_found_title', 'command.blacklist.user_not_found_description', 'RED', {}, 'warning')
    }

    await member.ban({ reason: reason })
    await new Blacklist({
      userID: member.id,
      reason: reason,
      staffID: inter.member.id,
      staffName: inter.member.displayName,
      date: getCurrentDate()
    }).save().then(async () => {
      await this.handleLog(guild, inter, member.id, 'add', 'global')

      this.writeAuditLog(guild.guildID, inter.member.id, "global_blacklist_added", `Blacklisted ${member.id} reason ${reason}`)

      return await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN')
    }).catch(async err => {
      return await this.respond(inter, 'command.blacklist.error_title', 'command.blacklist.error_description', 'RED', {}, 'error')
    })
  }

  public async handleLocalBlacklist(inter: ModalSubmitInteraction, member: GuildMember, guild: FGuild, reason: string, localBlacklist: FLocalBlacklist) {
    if (isBotOrSystem(member)) {
      return await this.respond(inter, 'command.blacklist.cannot_blacklist_bot_title', 'command.blacklist.cannot_blacklist_bot_description', 'RED', {}, 'warning')
    }

    if (localBlacklist) {
      return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', {}, 'warning')
    }

    if (!member) {
      return await this.respond(inter, 'command.blacklist.user_not_found_title', 'command.blacklist.user_not_found_description', 'RED', {}, 'warning')
    }

    await member.ban({ reason: reason })
    await new LocalBlacklist({
      userID: member.id,
      reason: reason,
      staff: inter.member.id,
      guildID: inter.guildId,
      date: getCurrentDate()
    }).save().then(async () => {
      await this.handleLog(guild, inter, member.id, 'add', 'local')

      this.writeAuditLog(guild.guildID, inter.member.id, "local_blacklist_added", `Blacklisted ${member.id} reason ${reason}`)

      return await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN')
    }).catch(async err => {
      return await this.respond(inter, 'command.blacklist.error_title', 'command.blacklist.error_description', 'RED', {}, 'error')
    })
  }

  async respond (inter: ModalSubmitInteraction, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
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

  async handleLog(guild: FGuild, inter: ModalSubmitInteraction, user: string, type: string, log: string) {
    await this.sendLog(guild, inter.member, (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title'),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user),
        await Blacklist.findOne({ userID: user }),
        await LocalBlacklist.findOne({ userID: user, guildId: inter.guildId })
      ));
  }
}

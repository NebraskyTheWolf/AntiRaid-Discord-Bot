import Blacklist, { IBlacklist as FBlacklist } from '@fluffici.ts/database/Common/Blacklist'
import LocalBlacklist from '@fluffici.ts/database/Common/LocalBlacklist'
import { Guild as FGuild } from '@fluffici.ts/database/Guild/Guild'
import BaseCommand from '@fluffici.ts/components/BaseCommand'
import Staff from '@fluffici.ts/database/Guild/Staff'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import {
  fetchDGuild,
  fetchMember,
  getCurrentDate,
  isBotOrSystem,
  isNull
} from '@fluffici.ts/types'

import { CommandInteraction, Guild, GuildMember, User } from 'discord.js'
import {
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandUserOption
} from '@discordjs/builders'

export default class CommandGlobal extends BaseCommand {

  public constructor () {
    super("blacklist", "This command will let you blacklist someone globally.", new OptionMap<string, boolean>().add('isProtected', true), 'MODERATION')

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add a user to the global blacklist.")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
        .addStringOption(
          new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Set a reason for the blacklist.")
            .setRequired(true)
        )
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("remove")
        .setDescription("Remove a user from the global blacklist.")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    )
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const fGuild = await this.getGuild(guild.id)
    const command = inter.options.getSubcommand()

    const staff = await Staff.findOne({ userID: inter.member.id })

    if (!staff) {
      return await this.respond(inter, 'command.blacklist.insufficient_permissions_title', 'command.blacklist.insufficient_permissions_description', 'RED', {}, 'error')
    }

    return await this.handleGlobalCommand(inter, command, fGuild)
  }

  async handleGlobalCommand (inter: CommandInteraction<'cached'>, command: string, guild: FGuild) {
    const user = inter.options.getString('user', true)
    const globalBlacklist: FBlacklist = await Blacklist.findOne({ userID: user })
    const member = await fetchMember(inter.guildId, user)
    const dGuild = await fetchDGuild(inter.guildId)

    switch (command) {
      case 'add': {
        const reason = inter.options.getString('reason', true)

        if (globalBlacklist) {
          return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', {}, 'warning')
        }

        if (!member) {
          return await this.respond(inter, 'command.blacklist.user_not_found_title', 'command.blacklist.user_not_found_description', 'RED', {}, 'warning')
        }

        await new Blacklist({
          userID: user,
          reason: reason,
          staffID: inter.member.id,
          staffName: inter.member.displayName,
          date: getCurrentDate()
        }).save()

        await this.handleLog(guild, inter, user, 'add', 'global')

        this.writeAuditLog(guild.guildID, inter.member.id, "global_blacklist_added", `Blacklisted ${user} reason ${reason}`)

        await member.ban({ reason: reason })

        return await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN')
      }
      case "remove": {
        const global = await Blacklist.findOne({ userID: user })
        if (!global) {
          return await this.respond(inter, 'command.blacklist.user_not_blacklisted_title', 'command.blacklist.user_not_blacklisted_description', 'RED', { user: user }, 'error')
        }

        await Blacklist.deleteOne({ userID: user })
        this.writeAuditLog(guild.guildID, inter.member.id, "global_blacklist_removed", `Unblacklisted ${user}`)
        await this.handleLog(guild, inter, user, 'remove', 'global')
      }
    }
  }

  async respond (inter: CommandInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
    await inter.reply({
      embeds: this.buildEmbedMessage(inter.member, {
        icon: icon,
        color: color,
        title: this.getLanguageManager().translate(titleKey, args),
        description: this.getLanguageManager().translate(descKey, args)
      }),
      ephemeral: true
    })
  }

  async handleLog(guild: FGuild, inter: CommandInteraction<'cached'>, user: string, type: string, log: string) {
    await this.sendLog(guild, await fetchMember(guild.guildID, user), (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user),
        await Blacklist.findOne({ userID: user }),
        await LocalBlacklist.findOne({ userID: user, guildID: inter.guildId })
      ));
  }
}

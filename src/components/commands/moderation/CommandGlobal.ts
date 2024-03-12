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
        .addUserOption(
          new SlashCommandUserOption()
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
        .addUserOption(
          new SlashCommandUserOption()
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
    const user = inter.options.getUser('user', true)
    const globalBlacklist: FBlacklist = await Blacklist.findOne({ userID: user.id })
    const member = await fetchMember(inter.guildId, user.id)
    const dGuild = await fetchDGuild(inter.guildId)

    switch (command) {
      case 'add': {
        const reason = inter.options.getString('reason', true)

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
          userID: user.id,
          reason: reason,
          staffID: inter.member.id,
          staffName: inter.member.displayName,
          date: getCurrentDate()
        }).save().then(async () => {
          await this.handleLog(guild, inter, user, 'add', 'global')

          return await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN')
        }).catch(async err => {
          return await this.respond(inter, 'command.blacklist.error_title', 'command.blacklist.error_description', 'RED', {}, 'error')
        })
        break
      }
      case "remove": {
        const global = await Blacklist.findOne({ userID: user.id })
        if (!global) {
          return await this.respond(inter, 'command.blacklist.user_not_blacklisted_title', 'command.blacklist.user_not_blacklisted_description', 'RED', { user: user.tag }, 'error')
        }

        await dGuild.bans.remove(user, 'FurRaidDB, Blacklist revoked by ' + inter.member.user.tag)

        await Blacklist.deleteOne({ userID: user.id })

        await this.handleLog(guild, inter, user, 'remove', 'global')
      }
    }
  }

  async respond (inter: CommandInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
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

  async handleLog(guild: FGuild, inter: CommandInteraction<'cached'>, user: User, type: string, log: string) {
    await this.sendLog(guild, inter.member, (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title'),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user.id),
        await Blacklist.findOne({ userID: user.id }),
        await LocalBlacklist.findOne({ userID: user.id, guildId: inter.guildId })
      ));
  }
}

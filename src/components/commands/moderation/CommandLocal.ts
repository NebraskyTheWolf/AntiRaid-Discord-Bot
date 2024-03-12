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

export default class CommandLocal extends BaseCommand {

  public constructor () {
    super("local", "This command will let you blacklist someone locally.", new OptionMap<string, boolean>().add('isProtected', true), 'MODERATION')

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

    return await this.handleLocalCommand(inter, command, fGuild)
  }

  async handleLocalCommand (inter: CommandInteraction<'cached'>, command: string, guild: FGuild) {
    const user = inter.options.getUser('user', true)

    switch (command) {
      case 'add': {
        const reason = inter.options.getString('reason', true)
        const member = await fetchMember(inter.guildId, user.id)
        if (isBotOrSystem(member)) {
          return await this.respond(inter, 'command.blacklist.cannot_blacklist_bot_title', 'command.blacklist.cannot_blacklist_bot_description', 'RED')
        }
        const local = await this.findLocal(user, inter.guildId)
        if (local) {
          return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', { user: user.tag }, 'error')
        }

        await this.handleLog(guild, inter, user, 'add', 'local')

        return await this.addMemberToBlacklist(inter, user, reason, member)
      }
      case 'remove': {
        const local = await this.findLocal(user, inter.guildId)
        if (!local) {
          return await this.respond(inter, 'command.blacklist.user_not_blacklisted_title', 'command.blacklist.user_not_blacklisted_description', 'RED', { user: user.tag }, 'error')
        }

        await this.handleLog(guild, inter, user, 'remove', 'local')

        return await this.removeMemberFromBlacklist(inter, user)
      }
    }
  }

  async findLocal (user: User, guildId: string) {
    return LocalBlacklist.findOne({
      guildId: guildId,
      userID: user.id
    })
  }

  async addMemberToBlacklist (inter: CommandInteraction<"cached">, user: User, reason: string, member: GuildMember) {
    await new LocalBlacklist({
      guildId: inter.guildId,
      userID: user.id,
      reason: reason,
      staff: inter.member.id,
      date: getCurrentDate()
    }).save().then(async () => {
      await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN', { user: user.tag })
      await member.ban({ reason: reason })
    }).catch(async (err) => {
      await this.respond(inter, 'command.blacklist.error_title', 'command.blacklist.error_description', 'RED', {}, 'error')
    })
  }

  async removeMemberFromBlacklist (inter: CommandInteraction<'cached'>, user: User) {
    await LocalBlacklist.deleteOne({
      guildId: inter.guildId,
      userID: user.id
    }).then(async () => {
      await this.respond(inter, 'command.blacklist.user_unblacklisted_title', 'command.blacklist.user_unblacklisted_description', 'GREEN', { user: user.tag })
    }).catch(async err => {
      await this.respond(inter, 'command.blacklist.error_title', 'command.blacklist.error_description', 'RED', {}, 'error')
    })
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
    await this.sendLog(guild, inter.member, (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user.tag }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user.id),
        await Blacklist.findOne({ userID: user.id }),
        await LocalBlacklist.findOne({ userID: user.id, guildId: inter.guildId })
      ));
  }
}

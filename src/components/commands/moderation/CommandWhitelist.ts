import Whitelist from '@fluffici.ts/database/Common/Whitelist'
import BaseCommand from '@fluffici.ts/components/BaseCommand'
import { getCurrentDate, isNull } from '@fluffici.ts/types'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember, InteractionReplyOptions, User} from 'discord.js'
import {
  SlashCommandSubcommandBuilder, SlashCommandUserOption
} from '@discordjs/builders'

export default class CommandWhitelist extends BaseCommand {
  public constructor() {
    super("whitelist", "Whitelist a user on this server.", new OptionMap<string, boolean>().add("isProtected", true), "MODERATION");


    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("check")
        .setDescription("Check if the user is a developer.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    );

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add a user to the local whitelist.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    );

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("remove")
        .setDescription("Remove a user from the local whitelist.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    )

  }

  async handler(inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const command: string = inter.options.getSubcommand() || 'default'
    const user: User = inter.options.getUser('user') || member.user

    await this.getGuild(guild.id)

    const whitelisted = await Whitelist.findOne({
      guildID: guild.id,
      userID: user.id
    })

    switch (command) {
      case 'check':
        const isWhitelisted = !isNull(whitelisted)
        const titleKey = `command.whitelist.${isWhitelisted ? 'whitelisted' : 'not_whitelisted'}.title`
        const descriptionKey = isWhitelisted ? 'command.whitelist.whitelisted.description' : 'command.whitelist.not_whitelisted.description'
        const fields = isWhitelisted ? [{
          name: 'ID',
          value: `${user.id}`,
          inline: false
        }, {
          name: 'Staff',
          value: `${whitelisted.staff}`,
          inline: false
        }] : []
        const color = isWhitelisted ? 'ORANGE' : 'RED'
        await inter.followUp(this.generateEmbedsResponse(member, titleKey,'info', color, fields, descriptionKey, { username: user.tag }))
        break
      case 'add':
        await this.handleAddCommand(inter, member, guild.id, user, whitelisted)
        break
      case 'remove':
        await this.handleRemoveCommand(inter, member, guild.id, user)
        break
      default:
        await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.title', 'warning', 'RED', [], 'command.whitelist.description'))
        break
    }
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

  private async handleAddCommand (inter: CommandInteraction<'cached'>, member: GuildMember, guildId: string, user: User, whitelisted: any): Promise<any> {
    if (whitelisted) {
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.already_whitelisted.title','info', 'ORANGE', [], 'command.whitelist.already_whitelisted.description'))
    }

    try {
      await new Whitelist({
        userID: user.id,
        staff: member.id,
        guildID: guildId,
        date: getCurrentDate()
      }).save()
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.added_success','success', 'ORANGE', [], 'command.whitelist.added_success.description'))
    } catch {
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.added_failed','error', 'RED', [], 'command.whitelist.added_failed.description'))
    }
  }

  private async handleRemoveCommand (inter: CommandInteraction<'cached'>, member: GuildMember, guildId: string, user: User): Promise<any> {
    try {
      await Whitelist.deleteOne({
        guildID: guildId,
        userID: user.id
      })
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.removed_success','success', 'ORANGE', [], 'command.whitelist.removed_success.description'))
    } catch {
      await inter.followUp(this.generateEmbedsResponse(member, 'command.whitelist.removed_failed','error', 'RED', [], 'command.whitelist.removed_failed.description'))
    }
  }
}

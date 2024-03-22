import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import {CommandInteraction, Guild, GuildMember} from 'discord.js'
import {
  SlashCommandBooleanOption,
  SlashCommandChannelOption, SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder
} from "@discordjs/builders";
import {ChannelType} from "discord-api-types/v10";
import GuildModel, { Guild as FGuild } from "@fluffici.ts/database/Guild/Guild"

export default class CommandSet extends BaseCommand {

  public constructor() {
    super("config", "This command will let you edit the configuration of your server.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", false),
      "ADMINISTRATOR"
    );

    this.addSubGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("set")
        .setDescription("Change the configuration of your server.")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("scamlinks")
            .setDescription("Change the configuration for the scam links")
            .addBooleanOption(
              new SlashCommandBooleanOption()
                .setName("enabled")
                .setDescription("Do you allow the scam link detected?")
                .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("global")
            .setDescription("Change the configuration for global database")
            .addBooleanOption(
              new SlashCommandBooleanOption()
                .setName("enabled")
                .setDescription("Do you allow the global database?")
                .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("local")
            .setDescription("Change the configuration for the local database")
            .addBooleanOption(
              new SlashCommandBooleanOption()
                .setName("enabled")
                .setDescription("Do you allow the local database?")
                .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("logging")
            .setDescription("Configure the channel for the logs")
            .addChannelOption(
              new SlashCommandChannelOption()
                .setName("channel")
                .setDescription("Please select a channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("language")
            .setDescription("Configure the language the bot will use for your server.")
            .addStringOption(
              new SlashCommandStringOption()
                .setName("lang")
                .setDescription("Please select the language")
                .addChoices({ name: 'Czech', value: 'cz' })
                .addChoices({ name: 'Slovak', value: 'sk' })
                .addChoices({ name: 'English', value: 'en' })
                .addChoices({ name: 'Pirate', value: 'pirate' })
                .addChoices({ name: 'Cat miaow', value: 'cat' })
                .setMinLength(2)
                .setMaxLength(12)
            )
        )
    )


  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const fGuild = await this.getGuild(guild.id);

    const group = inter.options.getSubcommandGroup(true)
    const command = inter.options.getSubcommand(true)

    switch (group) {
      case "set": {
        switch (command) {
          case "scamlinks": {
            return this.handleScamLinks(inter, fGuild)
          }
          case "global": {
            return this.handleGlobal(inter, fGuild)
          }
          case "local": {
            return this.handleLocal(inter, fGuild)
          }
          case "logging": {
            return this.handleLog(inter, fGuild)
          }
          case "language": {
            return this.handleLanguage(inter, fGuild)
          }
          default:
            await inter.followUp({
              embeds: this.buildEmbedMessage(member, {
                icon: 'info',
                title: this.getLanguageManager().translate('command.config.not_found.title'),
                description: this.getLanguageManager().translate('command.config.not_found.description')
              }),
              ephemeral: true
            })
        }
        break
      }
    }
  }

  async handleScamLinks(inter: CommandInteraction<'cached'>, guild: FGuild) {
    const scamLink = inter.options.getBoolean('enabled', true)

    await GuildModel.updateOne({ guildID: guild.guildID }, {
      $set: {
        scamLinks: scamLink
      }
    })

    await inter.followUp({
      content: `Scam detection set to ${scamLink ? 'Enabled' : 'Disabled'}`,
      ephemeral: true
    });
  }

  async handleGlobal(inter: CommandInteraction<'cached'>, guild: FGuild) {
    const global = inter.options.getBoolean('enabled', true)

    await GuildModel.updateOne({ guildID: guild.guildID }, {
      $set: {
        scamLinks: global
      }
    })

    await inter.followUp({
      content: `Global database set to ${global ? 'Enabled' : 'Disabled'}`,
      ephemeral: true
    });
  }

  async handleLocal(inter: CommandInteraction<'cached'>, guild: FGuild) {
    const local = inter.options.getBoolean('enabled', true)

    await GuildModel.updateOne({ guildID: guild.guildID }, {
      $set: {
        scamLinks: local
      }
    })

    await inter.followUp({
      content: `Local database set to ${local ? 'Enabled' : 'Disabled'}`,
      ephemeral: true
    });
  }

  async handleLog(inter: CommandInteraction<'cached'>, guild: FGuild) {
    const channel = inter.options.getChannel('channel', true)

    const channelType = channel.type;
    if (channelType === 'GUILD_TEXT') {
      await GuildModel.updateOne({ guildID: guild.guildID }, {
        $set: {
          logChannelID: channel.id
        }
      })

      this.writeAuditLog(guild.guildID, inter.member.id, "logging_changed", `Changed the logging channel to #${channel.name}`)

      await inter.followUp({
        content: `Logging channel has been set to ${channel.name}`,
        ephemeral: true
      });
    } else {
      await inter.followUp({
        content: `Invalid channel type. Please select a text channel.`,
        ephemeral: true
      });
    }
  }

  async handleLanguage(inter: CommandInteraction<'cached'>, guild: FGuild) {
    const language = inter.options.getString('lang', true)

    if (this.getLanguageManager().hasLanguage(language)) {
      await GuildModel.updateOne({ guildID: guild.guildID }, {
        $set: {
          language: language
        }
      })

      this.writeAuditLog(guild.guildID, inter.member.id, "language_changed", `Changed the language to ${language}`)

      await inter.followUp({
        content: `Language has been set to ${language}`,
        ephemeral: true
      });
    } else {
      await inter.followUp({
        content: `Invalid language. Please select a valid language.`,
        ephemeral: true
      });
    }
  }
}

import OptionMap from "@fluffici.ts/utils/OptionMap";
import Logger from "@fluffici.ts/logger";
import Riniya from "@fluffici.ts";
import LanguageManager from '@fluffici.ts/utils/LanguageManager'
import Guild, { Guild as FGuild } from '@fluffici.ts/database/Guild/Guild'
import ConfigManager from '@fluffici.ts/utils/ConfigManager'
import { ColorResolvable, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js'

export declare type ComponentType = 'BUTTON' | 'COMMAND' | 'MODAL' | 'TASK' | 'EVENT' | 'COMPONENT' | 'SERVER' | 'UNRELATED';

export default abstract class Base {
  public readonly instance: Riniya = Riniya.instance;
  public readonly name: string;
  public readonly description: string;
  public readonly type: ComponentType;
  public options?: OptionMap<string, boolean>;
  private readonly languageManager: LanguageManager = new LanguageManager()
  private readonly defaultConfig: ConfigManager = new ConfigManager()
  private readonly emojisConfig: ConfigManager = new ConfigManager()

  protected constructor (name: string,
    description?: string,
    type?: ComponentType) {
    this.name = name;
    this.description = description || "No description.";
    this.type = type || "UNRELATED";

    this.defaultConfig.setConfig('default')
    this.emojisConfig.setConfig('emojis')
  }

  protected setOptions (options: OptionMap<string, boolean>): void {
    this.options = options;
  }

  protected getHandle (): Riniya {
    return Riniya.instance;
  }

  protected getLogger (): Logger {
    return this.getHandle().logger;
  }

  protected getLanguageManager (): LanguageManager {
    return this.languageManager
  }

  protected async getGuild (id: string): Promise<FGuild> {
    const guild = await Guild.findOne({ guildID: id })
    this.languageManager.setLanguage(guild.language)

    return guild
  }

  protected getDefaultConfig (): ConfigManager {
    return this.defaultConfig;
  }

  protected getEmojisConfig (): ConfigManager {
    return this.emojisConfig;
  }

  protected async sendScamLog(guild: FGuild, message: Message, title: string = '', description: string = '', fields = []) {
    const channel: TextChannel = this.instance.guilds.cache.get(guild.guildID).channels.cache.get(guild.logChannelID) as TextChannel
    await channel.send({
      embeds: [
        {
          title: this.getEmojisConfig().get("warning") + ' ' + title,
          description: description,
          fields: fields,
          author: {
            name: message.member.user.tag,
            iconURL: message.member.user.avatarURL({ format: 'png' })
          },
          footer: {
            text: 'FurRaidBot',
            icon_url: this.instance.user.avatarURL({ format: 'png' })
          }
        }
      ],
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton(this.getLanguageManager()
              .translate('command.common.button.message'), `https://discord.com/channels/${guild.guildID}/${message.channelId}/${message.id}`)
          ]
        }
      ]
    })
  }

  protected async sendLog(guild: FGuild, member: GuildMember, icon: string = 'info',
    title: string = '', description: string = '', color: ColorResolvable = 'DEFAULT', fields = [],
    extra: OptionMap<string, any> = new OptionMap<string, any>())
  {
    const channel: TextChannel = this.instance.guilds.cache.get(guild.guildID).channels.cache.get(guild.logChannelID) as TextChannel;
    this.addExtraFieldsToLogs(extra, fields);

    await this.sendEmbedMessage(channel, member, { title: this.getEmojisConfig().get(icon) + ' ' + title, color: color, description: description, fields: fields });
  }

  private addExtraFieldsToLogs(extra: OptionMap<string, any>, fields: any[]): void {
    if (extra.has('isStaff')) {
      fields.push(
        {
          name: 'FurRaidDB Staff',
          value:  this.getEmojisConfig().get('staff') + ' ' + extra.get('isStaff'),
          inline: false
        }
      );
    }

    if (extra.has('isWhitelisted')) {
      fields.push(
        {
          name: 'Whitelisted',
          value: this.getEmojisConfig().get('success'),
          inline: false
        }
      );
    }
  }

  private async sendEmbedMessage(channel: TextChannel, member: GuildMember, options: any): Promise<void> {
    await channel.send({
      embeds: [
        {
          title: options.title,
          color: options.color,
          description: options.description,
          fields: options.fields,
          author: {
            name: member.user.tag,
            iconURL: member.user.avatarURL({ format: 'png' })
          },
          footer: {
            text: 'FurRaidBot',
            icon_url: this.instance.user.avatarURL({ format: 'png' })
          }
        }
      ]
    });
  }

  protected buildEmbedMessage(member: GuildMember, options: any) {
    return [
      {
        title: 'FurRaidDB - ' + this.getEmojisConfig().get(options.icon) + ' ' + options.title,
        color: options.color,
        description: options.description,
        fields: options.fields,
        author: {
          name: member.user.tag,
          iconURL: member.user.avatarURL({ format: 'png' })
        },
        footer: {
          text: 'FurRaidBot',
          icon_url: this.instance.user.avatarURL({ format: 'png' })
        }
      }
    ]
  }
}

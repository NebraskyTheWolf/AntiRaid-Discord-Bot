import BaseEvent from "@fluffici.ts/components/BaseEvent";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";

import fetch from "node-fetch"

import {Message, Snowflake} from "discord.js";
import {registerCommands} from "@fluffici.ts/utils/registerCommand";
import Migrated, {IMigrated} from "@fluffici.ts/database/Security/Migrated";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {isBotOrSystem} from "@fluffici.ts/types";


interface Offence {
  timestamp: number;
  count: number;
}

export default class MessageEvent extends BaseEvent {

  private readonly offences: OptionMap<Snowflake, Offence> = new OptionMap<Snowflake, Offence>()

  public constructor () {
    super('messageCreate', async (message: Message) => {
      if (isBotOrSystem(message.member)) return;

      const guild = await this.getGuild(message.guildId);

      if (message.content.indexOf('frdb!') !== -1) {
        await this.handleMigrationCommand(message);
      }

      if (guild.scamLinks) {
        await this.handleScamLinks(message, guild);
      }

      if (message.embeds.length > 0) {
        await this.handleUserEmbed(message)
      }
    })
  }

  async handleMigrationCommand(message: Message): Promise<void> {
    if (message.member.permissions.has('ADMINISTRATOR')) {
      const migrate: IMigrated = await Migrated.findOne({guildId: message.guildId});
      if (migrate) {
        await message.reply({
          content: this.getLanguageManager().translate('event.already_migrated')
        });
      } else {
        await registerCommands(
          this.instance,
          message.guild.id,
          message.guild.name,
          this.instance.manager
        );
        await message.reply({
          content: this.getLanguageManager().translate('event.transition')
        });
        await new Migrated({
          guildId: message.guildId
        }).save();
      }
    }
  }

  async handleScamLinks(message: Message, guild: FGuild): Promise<void> {
    const urls = this.extractUrls(message.content);
    const scamUrl = await this.findScamUrl(urls);

    if (scamUrl) {
      await this.handleOffence(message);
      await this.handleScam(guild, message, scamUrl);
    }
  }

  async handleOffence(message: Message): Promise<void> {

    const offence = this.offences.get(message.member.id);
    const currentTime = Date.now();

    if (this.offences.has(message.member.id)) {

    } else {
      this.offences.add(message.member.id, { timestamp: Date.now(), count: 1});
    }
  }

  private async findScamUrl (url: string): Promise<string | null> {
    const res = await this.callScamDetection(url)
    if (res.scam) {
      return url
    }
    return null;
  }

  private async callScamDetection (url: string): Promise<any> {
    const apiUrl = this.getDefaultConfig().get('fluffici-api') + '/api/moderation/scam-detection/link?link=' + url
    const response = await fetch(apiUrl, {
      method: 'GET'
    })
    if (!response.ok) throw new Error('Failed to fetch data')
    return response.json()
  }

  private async handleScam (guild: FGuild, message: Message, scamUrl: string, muted: boolean = false, offence: Offence = null): Promise<void> {
    await message.reply({
      content: this.getLanguageManager().translate('event.message.scam_detected'),
    }).then(m => setTimeout(() => m.delete(), 10 * 1000))
    await message.delete()

    const logDetails = [
      {
        name: `Scam url:`,
        value: `${scamUrl}`,
        inline: false
      },
      {
        name: `ID:`,
        value: `${message.author.id}`,
        inline: false
      },
      {
        name: `Username:`,
        value: `${message.author.displayName}`,
        inline: false
      }
    ]

    if (muted) {
      logDetails.push(
        {
          name: this.getLanguageManager().translate('common.reason'),
          value: `Spamming of scam-links Strikes (${offence.count})/5`,
          inline: false
        }
      )
    }

    const title = muted ? this.getLanguageManager().translate('event.message.log.title.muted') : this.getLanguageManager().translate('event.message.log.title')
    const desc = this.getLanguageManager().translate('event.message.log.description')

    await this.sendScamLog(guild, message, title, desc, logDetails)
  }

  private extractUrls (text: string): string {
    return text.match('((https?:\\/\\/)?[\\w-]+(\\.[\\w-]+)+\\.?(:\\d+)?(\\/\\S*)?)')[0]
      .replace('https://', '')
      .replace('http://', '')
      .replace('/', '');
  }

  private async handleUserEmbed(message: Message) {
    if (message.author.bot) return;
    if (message.author.system) return;

    await message.reply({
      content: this.getLanguageManager().translate('event.embed_detected'),
    }).then(m => setTimeout(() => m.delete(), 10 * 1000));

    await message.member.timeout(600 * 1000,'Self-bot prevention - Embed detected');
  }
}

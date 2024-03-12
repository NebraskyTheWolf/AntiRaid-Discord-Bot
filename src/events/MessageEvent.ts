import BaseEvent from "@fluffici.ts/components/BaseEvent";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";

import fetch from "node-fetch"

import {Message} from "discord.js";
import {registerCommands} from "@fluffici.ts/utils/registerCommand";

export default class MessageEvent extends BaseEvent {
  public constructor () {
    super('messageCreate', async (message: Message) => {
      if (this.isBotOrSystem(message)) return

      const guild = await this.getGuild(message.guildId)

      if (message.content.indexOf('frdb!') !== -1) {

        await registerCommands(
          this.instance,
          message.guild.id,
          message.guild.name,
          this.instance.manager
        );

        await message.reply({
          content: this.getLanguageManager().translate('event.transition')
        })
      }

      if (guild.scamLinks) {
        const urls = this.extractUrls(message.content)
        const scamUrl = await this.findScamUrl(urls)

        if (scamUrl) {
          await this.handleScam(guild, message, scamUrl)
        }
      }
    })
  }

  private isBotOrSystem (message: Message): boolean {
    return message.author.bot || message.author.system
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

  private async handleScam (guild: FGuild, message: Message, scamUrl: string): Promise<void> {
    await message.reply({
      content: this.getLanguageManager().translate('event.message.scam_detected'),
    })
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

    const title = `${this.getLanguageManager().translate('event.message.log.title')}`
    const desc = this.getLanguageManager().translate('event.message.log.description')

    await this.sendScamLog(guild, message, title, desc, logDetails)
  }

  private extractUrls (text: string): string {
    return text.match('((https?:\\/\\/)?[\\w-]+(\\.[\\w-]+)+\\.?(:\\d+)?(\\/\\S*)?)')[0]
      .replace('https://', '')
      .replace('http://', '')
      .replace('/', '');
  }
}

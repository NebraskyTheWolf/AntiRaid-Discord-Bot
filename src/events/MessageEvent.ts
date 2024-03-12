import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { Guild as FGuild } from "@fluffici.ts/database/Guild/Guild";

import fetch from "node-fetch"

import { Message } from "discord.js";

export default class MessageEvent extends BaseEvent {
  public constructor () {
    super('messageCreate', async (message: Message) => {
      if (this.isBotOrSystem(message)) return

      const guild = await this.getGuild(message.guildId)

      const urls = this.extractUrls(message.content)
      const scamUrl = await this.findScamUrl(urls)

      if (scamUrl) {
        await this.handleScam(guild, message, scamUrl)
      }

      this.instance.emit('messageCheck', { message: message })
    })
  }

  private isBotOrSystem (message: Message): boolean {
    return message.author.bot || message.author.system
  }

  private async findScamUrl (urls: string[]): Promise<string | null> {
    for (const url of urls) {
      const res = await this.callScamDetection(url)
      if (res?.scam) return url
    }
    return null
  }

  private async callScamDetection (url: string): Promise<any> {
    const apiUrl = this.getDefaultConfig().get('fluffici-api') + '/moderation/scam-detection/link?' + url
    const response = await fetch(apiUrl, {
      method: 'GET'
    })
    if (!response.ok) throw new Error('Failed to fetch data')
    return response.json()
  }

  private async handleScam (guild: FGuild, message: Message, scamUrl: string): Promise<void> {
    const filteredContent = this.removeUrls(message.content)
    await message.edit(filteredContent)
    await message.reply(this.getLanguageManager().translate('event.message.scam_detected'))

    const logDetails = [
      {
        name: `Scam url:`,
        value: `${scamUrl}}`,
        inline: false
      },
      {
        name: `ID:`,
        value: `${message.author.id}}`,
        inline: false
      },
      {
        name: `Username:`,
        value: `${message.author.displayName}}`,
        inline: false
      }
    ]

    const title = `FurRaidBot - ${this.getLanguageManager().translate('event.message.log.title')}`
    const desc = this.getLanguageManager().translate('event.message.log.description')

    await this.sendScamLog(guild, message, title, desc, logDetails)
  }

  private extractUrls (text: string): string[] {
    const urls = text.match('/((https?:\\/\\/)?[\\w-]+(\\.[\\w-]+)+\\.?(:\\d+)?(\\/\\S*)?)') || [];
    return urls.map((url: string) => url.replace(/\s/g, ''));
  }

  private removeUrls (text: string): string {
    return text.replace('/((https?:\\/\\/)?[\\w-]+(\\.[\\w-]+)+\\.?(:\\d+)?(\\/\\S*)?)', '********')
  }
}

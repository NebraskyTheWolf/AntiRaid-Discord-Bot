import BaseEvent from "@fluffici.ts/components/BaseEvent";
import guild, {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";

import fetch from "node-fetch"

import {Message, Snowflake, TextChannel} from "discord.js";
import {registerCommands} from "@fluffici.ts/utils/registerCommand";
import Migrated, {IMigrated} from "@fluffici.ts/database/Security/Migrated";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {fetchDGuild, isBotOrSystem} from "@fluffici.ts/types";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import PreventTicket from "@fluffici.ts/database/Security/PreventTicket";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";


interface Offence {
  timestamp: number;
  count: number;
  lastMessage?: string;
  lastMessageTimestamp?: number;
}

export default class MessageEvent extends BaseEvent {

  private readonly offences: OptionMap<Snowflake, Offence> = new OptionMap<Snowflake, Offence>()
  private messageThreshold: number = 25;
  private timePeriod: number = 10000;
  private repeatTimePeriod: number = 10000;
  private messageTimePeriod: number = 10000;

  public constructor () {
    super('messageCreate', async (message: Message) => {
      if (isBotOrSystem(message.member)) return;

      const guild = await this.getGuild(message.guildId);

      if (message.content.indexOf('frdb!') !== -1) {
        await this.handleMigrationCommand(message);
      }

      try {
        this.handleTicketMessage(message)
      } catch (e) {
        this.instance.logger.error(e)
      }

      try {
        if (this.instance.spamProtectionEnabled) {
          await this.handleOffence(message, guild);
        }
      } catch (e) {
        this.instance.logger.error(e)
      }

      try {
        if (guild.scamLinks) {
          await this.handleScamLinks(message, guild);
        }
      } catch (e) {
        this.instance.logger.error(e)
      }
    })
  }

  async handleTicketMessage(message: Message) {
    if (message.channel.type === 'GUILD_TEXT') {
      const channel = message.channel as TextChannel;
      const guild = channel.guild;
      const member = guild.members.cache.get(message.author.id);
      if (member) {
        const isTicket = await Ticket.findOne({
          channelId: channel.id,
          isClosed: false
        });
        if (isTicket) {
          new TicketMessage({
            ticketId: isTicket._id,
            userId: member.id,
            message: message.content
          }).save()
        }
      }
    }
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
      await this.handleScam(guild, message, scamUrl);
    }
  }

  async handleOffence(message: Message, guild: FGuild): Promise<void> {
    const currentTime = Date.now();

    const isTicket = await Ticket.findOne({
      channelId: message.channelId,
      userId: message.author.id,
      isClosed: false
    })

    if (this.offences.has(message.member.id)) {
      let offence: Offence = this.offences.get(message.author.id) || { timestamp: currentTime, lastMessage: '', lastMessageTimestamp: currentTime, count: 0 };

      if (currentTime <= offence.timestamp + this.timePeriod) {
        offence.count++;
      } else {
        offence.count = 1;
      }

      if (message.content === offence.lastMessage && currentTime <= offence.timestamp + this.repeatTimePeriod) {
        message.reply({ content: `${this.getLanguageManager().translate("common.dont.repeat")}`}).then(m => setTimeout(() => m.delete(), this.repeatTimePeriod))
        message.delete()
        return
      }

      // Update the timestamp
      offence.timestamp = currentTime;
      offence.lastMessage = message.content;
      offence.lastMessageTimestamp = currentTime;

      // If the count exceeds the threshold, take action
      if (offence.count > this.messageThreshold) {
        message.reply({ content: `${this.getLanguageManager().translate("common.dont.spam")}`})
        message.member.timeout(600 * 1000, "Spam")

        if (isTicket) {
          const guild = await fetchDGuild(message.guildId)
          guild.channels.cache.get(isTicket.channelId).delete("Spamming in a support ticket.")
          new PreventTicket({
            userId: message.author.id
          }).save()
        }

        await this.handleSpamLog(guild, message, offence, false)
      }

      // Save the updated offence back to the map
      this.offences.add(message.author.id, offence);
    } else {
      this.offences.add(message.member.id, { timestamp: Date.now(), lastMessage: message.content, lastMessageTimestamp: currentTime, count: 1});
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

  private async handleSpamLog(guild: FGuild, message: Message, offence: Offence, isEveryone: boolean = false) {
    const logDetails = [
      {
        name: `${isEveryone ? '[Spam of @ everyone]' : '[Message spamming]' }`,
        value: this.getLanguageManager().translate(isEveryone ? "event.message.spam.detected.everyone" : "event.message.spam.detected", {
          messages: `${offence.count}`,
          ratelimit: `${this.messageTimePeriod/1000}`
        }),
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

    const title = this.getLanguageManager().translate('event.message.log.title.spam', {
      id: message.author.id
    })
    await this.sendScamLog(guild, message, title, 'blep', logDetails)
  }

  private extractUrls (text: string): string {
    let cleanedText = text;
    let markdownLinkPattern = '[(.*?)\]\((.*?))';

    if (text.match(markdownLinkPattern)) {
      cleanedText = text.replace(markdownLinkPattern, "");
    }

    let urlMatch = cleanedText.match("((https?://)?[\\w-]+(\\.[\\w-]+)+\\.?(:\\d+)?(/\\S*)?)");

    console.log(urlMatch)

    return urlMatch[0].replace(/https?:\/\//, '')
      .replace('/', '')
      .replace(')', '');
  }
}

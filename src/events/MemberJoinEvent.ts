import BaseEvent from '@fluffici.ts/components/BaseEvent'
import { GuildMember } from 'discord.js'
import { IBlacklist as FBlacklisted } from '@fluffici.ts/database/Common/Blacklist'
import { LocalBlacklist as FLocalBlacklist } from '@fluffici.ts/database/Common/LocalBlacklist'
import { createExtraOptions, isBotOrSystem, isNull } from '@fluffici.ts/types'
import { Guild as FGuild } from '@fluffici.ts/database/Guild/Guild'


export default class MemberJoin extends BaseEvent {
  public constructor () {
    super('guildMemberAdd', async (member: GuildMember) => {
      if (isBotOrSystem(member)) return

      const [
        guild,
        blacklisted,
        localBlacklist,
        whitelist,
        staff
      ] = await this.fetchRequiredData(member)

      const extra = createExtraOptions(whitelist, staff)

      if (guild.logChannelID) {
        await this.sendLog(guild, member, 'warning', this.getLanguageManager().translate('event.member_added.title', {
          id: member.id
        }), this.getLanguageManager().translate('event.member_added.description'), 'GREEN', this.generateLogDetails(member, blacklisted, localBlacklist), extra)

        await this.handleBan(guild, member, blacklisted, localBlacklist)
      }
    })
  }

  private async handleBan(guild: FGuild, member: GuildMember, blacklisted: FBlacklisted, locallyBlacklisted: FLocalBlacklist) {
    if (blacklisted) {
      await this.handleMember(member, blacklisted.reason)
      await member.ban({ reason: blacklisted.reason })

      return await this.sendLog(guild, member, 'ban', this.getLanguageManager().translate('event.member_added.banned_globally', {
        username: member.user.tag
      }), '', '#640d85', [
        {
          name: 'ID',
          value: `${member.id}`
        },
        {
          name: 'FurRaidDB Staff',
          value: `${blacklisted.staffName} (${blacklisted.staffID})`
        },
        {
          name: this.getLanguageManager().translate('event.member_added.ban_reason'),
          value: `${blacklisted.reason}`
        }
      ])
    }

    if (locallyBlacklisted) {
      await this.handleMember(member, locallyBlacklisted.reason)
      await member.ban({ reason: locallyBlacklisted.reason })

      return await this.sendLog(guild, member, 'ban', this.getLanguageManager().translate('event.member_added.banned_locally', {
        username: member.user.tag
      }), '', '#640d85', [
        {
          name: 'ID',
          value: `${member.id}`
        },
        {
          name: this.getLanguageManager().translate('event.member_added.ban_author'),
          value: `${locallyBlacklisted.staff}`
        },
        {
          name: this.getLanguageManager().translate('event.member_added.ban_reason'),
          value: `${locallyBlacklisted.reason}`
        }
      ])
    }
  }

  public async handleMember(member: GuildMember, reason: string) {
    await member.send({
      embeds: [
        {
          title: 'Zabanován systémem FurRaidDB / Banned by FurRaidDB system',
          color: '#ff0000',
          fields: [
            {
              name: ':flag_cz:',
              value: `Discord bot s největší raider databází pro České a Slovenské furry komunity.\n**Důvod:** ${reason}`
            },
            {
              name: ':flag_us:',
              value: `Discord bot with the biggest raider database for Czech and Slovak furry communities.\n**Reason:** ${reason}`
            }
          ],
          author: {
            name: member.user.tag,
            iconURL: member.user.avatarURL({ format: 'png' })
          },
          footer: {
            text: 'FurRaidDB',
            iconURL: this.instance.user.avatarURL({ format: 'png' })
          }
        }
      ]
    })
  }
}

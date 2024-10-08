import BaseEvent from '@fluffici.ts/components/BaseEvent';
import { GuildMember, MessageButton, Snowflake, TextChannel } from 'discord.js';
import { IBlacklist as FBlacklisted } from '@fluffici.ts/database/Common/Blacklist';
import { LocalBlacklist as FLocalBlacklist } from '@fluffici.ts/database/Common/LocalBlacklist';
import { isBotOrSystem } from '@fluffici.ts/types';
import { Guild as FGuild } from '@fluffici.ts/database/Guild/Guild';
import RaidSession from "@fluffici.ts/database/Security/RaidSession";
import { v4 } from "uuid";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import PreventedRaid from "@fluffici.ts/database/Security/PreventedRaid";
import Reminder from "@fluffici.ts/database/Security/Reminder";

const BASE_RAID_MEMBER_THRESHOLD = 10;
const JOIN_RATE_TIME = 10 * 1000;  // Interval (ms) to consider multiple joins as a raid.
const affectedMembers: string[] = [];

export interface Joined {
  member: GuildMember;
  joinedAt: number;
  hasBeenLocked: boolean;
}

export default class MemberJoin extends BaseEvent {
  private readonly joinTimestamps: OptionMap<Snowflake, OptionMap<Snowflake, Joined>> = new OptionMap<Snowflake, OptionMap<Snowflake, Joined>>();
  private readonly joinCounters: OptionMap<Snowflake, number> = new OptionMap<Snowflake, number>();
  private readonly counterTimestamps: OptionMap<Snowflake, number> = new OptionMap<Snowflake, number>();

  public constructor() {
    super('guildMemberAdd', async (member: GuildMember) => {
      if (isBotOrSystem(member) || this.isProtectedRole(member)) return;

      const guild = await this.getGuild(member.guild.id);

      let reminder = await new Reminder({
        memberId: member.id
      }).save();

      this.instance.logger.info(`Adding ${member.id} to the reminder list (RID: ${reminder._id})`);

      await this.handleBLCheck(member);
      await this.handleRaidProtection(member, guild);
    });
  }

  private isProtectedRole(member: GuildMember): boolean {
    const protectedRoles = ["606535408117088277", "606540681867034634", "606540994909044756", "782578470135660585"];
    return member.roles.cache.some(role => protectedRoles.includes(role.id));
  }

  private async handleRaidProtection(member: GuildMember, guild: FGuild) {
    const guildID = member.guild.id;
    const joined: Joined = {
      member: member,
      joinedAt: Date.now(),
      hasBeenLocked: false
    };

    if (!this.joinTimestamps.has(guildID)) {
      this.joinTimestamps.add(guildID, new OptionMap<Snowflake, Joined>());
      this.counterTimestamps.add(guildID, Date.now());
    }

    const guildJoinTimestamps = this.joinTimestamps.get(guildID);
    guildJoinTimestamps.add(member.id, joined);

    // Reset counter if the interval has passed
    if (Date.now() - this.counterTimestamps.get(guildID) >= JOIN_RATE_TIME) {
      this.joinCounters.remove(guildID);
      this.joinTimestamps.remove(guildID);
      this.counterTimestamps.remove(guildID);
      guildJoinTimestamps.remove(member.id);
    } else {
      let counter = this.joinCounters.get(guildID, 0);
      counter += 1;
      this.joinCounters.add(guildID, counter);

      const raidThreshold = this.getRaidThreshold(member.guild.memberCount);

      if (counter >= raidThreshold) {
        const session = v4();
        const membersToLock = [];

        for (const [, m] of guildJoinTimestamps.getMap()) {
          if (Date.now() - m.joinedAt <= JOIN_RATE_TIME) {
            try {
              await m.member.timeout(600 * 1000).catch(console.error);
              affectedMembers.push(`${m.member.user.username}#${m.member.user.discriminator}`);
              await new RaidSession({
                session: session,
                userId: m.member.id
              }).save();
            } catch (err) {
              console.error(err);
            }
            m.hasBeenLocked = true;
            membersToLock.push(m.member);
          }
        }

        await new PreventedRaid({
          session: session
        }).save();

        await this.handleRaidLog(session, guild, membersToLock);
      }

      this.instance.logger.info(`[Debug] Handled raid protection for guild ${guildID} with current details:\n
        Total join timestamps stored: ${guildJoinTimestamps.getMap().size}
        Counter: ${counter}\n Timestamp: ${this.counterTimestamps.get(guildID)}\n
        Members potentially involved in the raid (${affectedMembers.length}): ${affectedMembers.join(', ')}\n
      `);
    }
  }

  private getRaidThreshold(memberCount: number): number {
    return Math.max(BASE_RAID_MEMBER_THRESHOLD, Math.ceil(memberCount / 100));
  }

  private async handleRaidLog(session: string, guild: FGuild, members: GuildMember[]) {
    const announcementChannel = this.instance.guilds.cache
      .get(guild.guildID)?.channels.cache
      .get(guild.logChannelID) as TextChannel;

    if (!announcementChannel) {
      this.instance.logger.warn(`Log channel not found for guild ${guild.guildID}`);
      return;
    }

    const confirmButton = this.instance.buttonManager.getButton("row_confirm_bulk_blacklist");
    const cancelButton = this.instance.buttonManager.getButton("row_cancel_bulk_blacklist");
    confirmButton.arguments.add("sessionId", session);
    cancelButton.arguments.add("sessionId", session);

    await announcementChannel.send({
      embeds: [
        {
          title: "FurRaidDB - Lockdown initiated.",
          description: `${affectedMembers.join(', ')} were affected.`,
          fields: [
            {
              name: this.getLanguageManager().translate("common.reason"),
              value: this.getLanguageManager().translate("common.alert.message.one")
            },
            {
              name: this.getLanguageManager().translate("common.raid.value"),
              value: this.getLanguageManager().translate("common.alert.message.two", {
                affected: `${affectedMembers.length}`,
                ratelimit: `${JOIN_RATE_TIME / 1000}s`
              }),
            },
            {
              name: this.getLanguageManager().translate("common.action"),
              value: this.getLanguageManager().translate("common.alert.message.three")
            },
          ],
          timestamp: new Date()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            confirmButton.generate() as MessageButton,
            cancelButton.generate() as MessageButton,
          ]
        }
      ]
    });
  }

  private async handleBLCheck(member: GuildMember) {
    const [
      guild,
      blacklisted,
      localBlacklist,
    ] = await this.fetchRequiredData(member);

    if (guild.logChannelID) {
      await this.sendLog(guild, member, 'warning', this.getLanguageManager().translate('event.member_added.title', {
        id: member.id
      }), this.getLanguageManager().translate('event.member_added.description'), 'GREEN', this.generateLogDetails(member, blacklisted, localBlacklist));

      await this.handleBan(guild, member, blacklisted, localBlacklist);
    }
  }

  private async handleBan(guild: FGuild, member: GuildMember, blacklisted: FBlacklisted, locallyBlacklisted: FLocalBlacklist) {
    if (blacklisted) {
      await this.handleMember(member, blacklisted.reason);

      await this.sendLog(guild, member, 'ban', this.getLanguageManager().translate('event.member_added.banned_globally', {
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
          name: this.getLanguageManager().translate('common.reason'),
          value: `${blacklisted.reason}`
        }
      ]);

      await member.ban({ reason: blacklisted.reason });
    }

    if (locallyBlacklisted) {
      await this.handleMember(member, locallyBlacklisted.reason);

      await this.sendLog(guild, member, 'ban', this.getLanguageManager().translate('event.member_added.banned_locally', {
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
      ]);

      await member.ban({ reason: locallyBlacklisted.reason });
    }
  }

  public async handleMember(member: GuildMember, reason: string) {
    await member.send({
      embeds: [
        {
          title: 'Zabanován systémem FurRaidDB / Banned by FurRaidDB system',
          color: 'RED',
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
          },
          timestamp: new Date()
        }
      ],
    }).catch(console.error);
  }
}

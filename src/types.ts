import Riniya from "@fluffici.ts";
import Logger from "@fluffici.ts/logger";
import GuildModel from "@fluffici.ts/database/Guild/Guild";

import {GuildMember, TextChannel, User} from "discord.js"
import {Whitelist as FWhitelisted} from '@fluffici.ts/database/Common/Whitelist'
import Staff, {Staff as FStaff} from '@fluffici.ts/database/Guild/Staff'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import Interaction from "@fluffici.ts/database/Guild/Interaction";
import Verification from "@fluffici.ts/database/Guild/Verification";

export function getInstance(): Riniya {
    return Riniya.instance;
}

export function getLogger(): Logger {
    return Riniya.instance.logger;
}

export async function fetchDGuild(guildId: string) {
  return getInstance().guilds.fetch(guildId)
}

export async function fetchGuild(guildId: string) {
    return GuildModel.findOne({ guildId: guildId })
}

export async function fetchMember(guildId: string, memberId: string): Promise<GuildMember> {
    return Riniya.instance.guilds.cache.get(guildId).members.cache.get(memberId);
}

export function fetchSyncMember(guildId: string, memberId: string): GuildMember {
  return Riniya.instance.guilds.cache.get(guildId).members.cache.get(memberId);
}

export async function fetchUser(userId: string): Promise<User> {
  return await Riniya.instance.users.fetch(userId, {force: true, cache: false});
}

export async function fetchMemberByStaff(memberName: string): Promise<GuildMember> {
  const staff: FStaff = await Staff.findOne({
    name: memberName
  })

  return Riniya.instance.guilds.cache.get('606534136806637589').members.cache.get(staff.userID);
}

export function isNull(object: unknown): Boolean {
  return object === null || object === undefined;
}

export function isTypeNull<T>(object: unknown): Boolean {
  return object === null || object === undefined || !(object as T);
}

export function createExtraOptions(whitelist: FWhitelisted, staff: FStaff): OptionMap<string, any> {
  const extra: OptionMap<string, any> = new OptionMap<string, any>()

  if (whitelist) {
    extra.add('isWhitelisted', true)
  }
  if (staff) {
    extra.add('isStaff', staff.rank)
  }

  return extra
}

export function getCurrentDate(): Date {
  return new Date(Date.now() + 1000)
}

export function isBotOrSystem (member: GuildMember): boolean {
  return member.user.bot || member.user.system
}

export function getAmountOfDays(timestamp: Date): number {
  const now = new Date()
  const diffInTime = now.getTime() - timestamp.getTime()

  return Math.ceil(diffInTime / (1000 * 60 * 60 * 24))
}

export async function updateVerification(target: GuildMember, message: string) {
  const channel: TextChannel = Riniya.instance.guilds.cache.get("606534136806637589").channels.cache.get("1220695667887046677") as TextChannel;
  const interMessage = await Interaction.findOne({
    guildId: '606534136806637589',
    memberId: target.id,
    deleted: false
  })

  if (isNull(interMessage)) {
    return;
  }

  const verificationId = await Verification.findOne({
    guildId: interMessage.guildId,
    memberId: interMessage.memberId
  }, null, {
    sort: {
      registeredAt: 1
    }
  })

  await channel.messages.fetch(interMessage.messageId).then(r => r.edit({
    components: [
      {
        type: 1,
        components: [
          Riniya.instance.buttonManager.createLinkButton(message, `https://bot.fluffici.eu/verifications/edit/${verificationId._id}`)
        ]
      }
    ]
  }))

  await Interaction.deleteOne({ _id: interMessage._id })
}

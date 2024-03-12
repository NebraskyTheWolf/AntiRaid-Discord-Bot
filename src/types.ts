/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   types.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alle.roy <alle.roy.student@42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/01/03 06:23:57 by NebraskyThe       #+#    #+#             */
/*   Updated: 2023/02/08 16:01:53 by alle.roy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Riniya from "@fluffici.ts";
import Logger from "@fluffici.ts/logger";
import GuildModel from "@fluffici.ts/database/Guild/Guild";

import { GuildMember } from "discord.js"
import Blacklist, { IBlacklist as FBlacklisted } from '@fluffici.ts/database/Common/Blacklist'
import LocalBlacklist, { LocalBlacklist as FLocalBlacklist } from '@fluffici.ts/database/Common/LocalBlacklist'
import Whitelist, { Whitelist as FWhitelisted } from '@fluffici.ts/database/Common/Whitelist'
import Staff, { Staff as FStaff } from '@fluffici.ts/database/Guild/Staff'
import OptionMap from '@fluffici.ts/utils/OptionMap'

export function getInstance(): Riniya {
    return Riniya.instance;
}

export function getLogger(): Logger {
    return Riniya.instance.logger;
}

export async function fetchDGuild(guildId: string) {
  return getInstance().guilds.cache.get(guildId)
}

export async function fetchGuild(guildId: string) {
    return GuildModel.findOne({ guildId: guildId })
}

export async function fetchMember(guildId: string, memberId: string): Promise<GuildMember> {
    return Riniya.instance.guilds.cache.get(guildId).members.cache.get(memberId);
}

export function isNull(object: unknown): Boolean {
  return object === null || object === undefined;
}

export function isTypeNull<T>(object: unknown): Boolean {
  return object === null || object === undefined || !(object as T);
}

export function createExtraOptions(whitelist: FWhitelisted, staff: FStaff): OptionMap<string, any> {
  const extra: OptionMap<string, any> = new OptionMap<string, any>()

  if (!isNull(whitelist.userID)) {
    extra.add('isWhitelisted', true)
  }
  if (!isNull(staff.userID)) {
    extra.add('isStaff', staff.rank)
  }

  return extra
}

export async function fetchRequiredData(member: GuildMember) {
  return Promise.all([
    this.getGuild(member.guild.id),
    Blacklist.findOne({
      userID: member.id,
      guildID: member.guild.id
    }),
    LocalBlacklist.findOne({
      userID: member.id,
      guildID: member.guild.id
    }),
    Whitelist.findOne({
      userID: member.id,
      guildID: member.guild.id
    }),
    Staff.findOne({ userID: member.id })
  ])
}

export function generateLogDetails(member: GuildMember, blacklisted: FBlacklisted, localBlacklist: FLocalBlacklist) {
  const yes = this.getLanguageManager().translate('common.yes');
  const no = this.getLanguageManager().translate('common.no');
  const days = this.getLanguageManager().translate('common.days');

  return [
    {
      name: 'ID',
      value: `${member.id}`,
      inline: false
    },
    {
      name: this.getLanguageManager().translate('common.joined'),
      value: getAmountOfDays(member.user.createdAt) + ' ' + days,
      inline: false
    },
    {
      name: this.getLanguageManager().translate('common.globally_blacklisted'),
      value: `${isNull(blacklisted.userID) ? no : yes}`,
      inline: false
    },
    {
      name: this.getLanguageManager().translate('common.locally_blacklisted'),
      value: `${isNull(localBlacklist.userID) ? no : yes}`,
      inline: false
    }
  ]
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

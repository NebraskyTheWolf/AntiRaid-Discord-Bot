import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { GuildMember } from "discord.js";
import Blacklist, { IBlacklist as FBlacklisted } from '@fluffici.ts/database/Common/Blacklist'
import LocalBlacklist, { LocalBlacklist as FLocalBlacklist } from '@fluffici.ts/database/Common/LocalBlacklist'
import {
  createExtraOptions,
  fetchRequiredData,
  generateLogDetails,
  getAmountOfDays,
  isBotOrSystem,
  isNull
} from '@fluffici.ts/types'
import Whitelist from '@fluffici.ts/database/Common/Whitelist'
import Staff from '@fluffici.ts/database/Guild/Staff'

export default class MemberLeave extends BaseEvent {
    public constructor() {
        super("guildMemberRemove", async (member: GuildMember) => {
          if (isBotOrSystem(member)) return

          const [
            guild,
            blacklisted,
            localBlacklist,
            whitelist,
            staff
          ] = await fetchRequiredData(member)

          const extra = createExtraOptions(whitelist, staff)

          if (!isNull(guild.logChannelID)) {
            await this.sendLog(guild, member, 'info', this.getLanguageManager().translate('event.member_removed.title', {
              id: member.id
            }), this.getLanguageManager().translate('event.member_removed.description'), 'RED', generateLogDetails(member, blacklisted, localBlacklist), extra)
          }
        });
    }
}

import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { GuildMember } from "discord.js";
import {
  createExtraOptions,
  isBotOrSystem,
} from '@fluffici.ts/types'
import Verification from "@fluffici.ts/database/Guild/Verification";
import Reminder from "@fluffici.ts/database/Security/Reminder";

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
          ] = await this.fetchRequiredData(member)

          const extra = createExtraOptions(whitelist, staff)

          if (guild.logChannelID) {
            await this.sendLog(guild, member, 'warning', this.getLanguageManager().translate('event.member_removed.title', {
              id: member.id
            }), this.getLanguageManager().translate('event.member_removed.description'), 'RED', this.generateLogDetails(member, blacklisted, localBlacklist), extra)
          }

          // Deleting reminders from the existing member.
          await Reminder.deleteOne({ memberId: member.id })
        });
    }
}

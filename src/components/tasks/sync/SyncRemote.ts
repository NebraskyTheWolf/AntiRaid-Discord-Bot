import LocalBlacklist from "@fluffici.ts/database/Common/LocalBlacklist";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import BaseTask from "@fluffici.ts/components/BaseTask";
import {fetchMember, fetchMemberByStaff} from "@fluffici.ts/types";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import {GuildMember} from "discord.js";

export default class SyncRemote extends BaseTask {
  public constructor() {
    super("SyncRemote", "Syncing all new entries from the dashboard", 10,
      async () => {
        const guild = await this.getGuild(this.getDefaultConfig().get('main-guild'))

        const blacklist = await Blacklist.find({ isRemote: true, isAcknowledged: false })
        blacklist.forEach(async item => {
          // Adding await to avoid data retention.
          // FIX: F-0002-2024
          await Blacklist.updateOne({
            _id: item._id,
          }, {
            $set: {
              isAcknowledged: true
            }
          }).then(async bl => {
            const member = await fetchMember(guild.guildID, item.userID)
            if (member) {
              await member.ban({ reason: `Blacklisted from the dashboard by ${item.staffName}` });
            }
            await this.handleLog(guild, await fetchMemberByStaff(item.staffName), item.userID, "add", "global");
          }).catch(err => {
            this.instance.logger.error(`Unable to synchronise ${item.userID} blacklist's from the dashboard : ${err}`)
          })
        });
      })
  }

  async handleLog(guild: FGuild, member: GuildMember, user: string, type: string, log: string) {
    await this.sendLog(guild, member, (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetailsString(
        user,
        await Blacklist.findOne({ userID: user }),
        await LocalBlacklist.findOne({ userID: user, guildID: guild.guildID })
      ), new OptionMap<string, any>().add("isRemote", true));
  }
}

import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";
import Reminder from "@fluffici.ts/database/Security/Reminder";
import {fetchMember} from "@fluffici.ts/types";

export default class CommandReminderUnlock extends BaseCommand {
    public constructor() {
        super("reminderunlock", "Unlocking all reminders", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      const reminders = await Reminder.find()

      const duplicates = await Reminder.aggregate([
        {
          $group: {
            _id: "$memberId",
            ids: { $addToSet: "$_id" },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      for(let record of duplicates) {
        record.ids.pop();
        console.log(record.ids + " deleted duplicates.")
        await Reminder.deleteMany({ _id: { $in: record.ids } });
      }

      await Reminder.updateMany({notified: true}, { $set: { notified: false } });

      const servers = reminders.map((guild) =>
        `> ** ID: ${guild.memberId} ** - R.ID: ${guild._id} - Notified: ${guild.notified} / Locked: ${guild.locked}\n`
      ).join('');

      console.log(servers)

      await inter.reply({
        content: 'Look at the console.',
        ephemeral: true
      })
    }
}

import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";
import Reminder from "@fluffici.ts/database/Security/Reminder";
import {fetchMember} from "@fluffici.ts/types";

export default class CommandReminderDBG extends BaseCommand {
    public constructor() {
        super("reminders", "Debugging the reminder", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      const reminders = await Reminder.find()



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

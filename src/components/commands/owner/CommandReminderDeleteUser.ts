import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";
import Reminder from "@fluffici.ts/database/Security/Reminder";
import {fetchMember} from "@fluffici.ts/types";
import {SlashCommandStringOption} from "@discordjs/builders";

export default class CommandReminderDeleteUser extends BaseCommand {
    public constructor() {
        super("reminderremove", "Removing a user from the reminder list", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );

        this.addStringOption(
          new SlashCommandStringOption()
            .setName("user")
            .setDescription("Select the user")
            .setRequired(true)
        )
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      const userId = inter.options.getString("user", true)

      const reminders = await Reminder.findOne({
        memberId: userId
      })

      if (reminders) {
        await Reminder.deleteOne({
          memberId: userId
        })

        await inter.reply({
          content: 'User deleted from the list.',
          ephemeral: true
        })
      } else {
        await inter.reply({
          content: 'This user is not in the list.',
          ephemeral: true
        })
      }
    }
}

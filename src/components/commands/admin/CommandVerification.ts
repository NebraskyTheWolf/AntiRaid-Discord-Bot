import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import {CommandInteraction, Guild, GuildMember, Role} from 'discord.js'
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "@discordjs/builders";
import Staff from "@fluffici.ts/database/Guild/Staff";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import {fetchMember, getCurrentDate} from "@fluffici.ts/types";
import Reminder from "@fluffici.ts/database/Security/Reminder";

export default class CommandVerification extends BaseCommand {

  public constructor() {
    super("verification", "This command allows you to manage the verification manually.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", false),
      "ADMINISTRATOR"
    );

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("manual")
        .setDescription("Verify a member manually")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("unverified")
        .setDescription("Show all the unverified members and some information.")
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("purge")
        .setDescription("Purge all unverified members.")
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("clear-reminders")
        .setDescription("Clearing out all the reminders.")
    )
  }

  async handler(inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {

    if (inter.guildId != '606534136806637589') {
      await inter.reply({
        content: `Sorry, but this feature is restricted.`,
        ephemeral: true
      });
      return;
    }

    const command = inter.options.getSubcommand()
    const unverifiedRole: Role = inter.guild.roles.cache.get('606542004708573219');
    const verifiedRole: Role = inter.guild.roles.cache.get('606542137819136020');

    switch (command) {
      case 'manual': {
        const user = inter.options.getString('user', true)
        const fMember = await fetchMember(inter.guildId, user)

        if (fMember.roles.cache.has(verifiedRole.id)) {
          return await inter.reply({
            content: this.getLanguageManager().translate("command.user.already_verified"),
            ephemeral: true
          })
        } else {
          fMember.roles.remove(unverifiedRole)
          fMember.roles.add(verifiedRole)

          return await inter.reply({
            content: this.getLanguageManager().translate("command.user.now_verified"),
            ephemeral: true
          })
        }
      }
      case "unverified": {
        let unverified = [];

        const reminders = await Reminder.find()
        const unverifiedMembers = await Promise.all(unverifiedRole.members.map(async x => {
          const reminder = await Reminder.findOne({ memberId: x.id });

          if (!reminder)
            return {
              user: x,
              reminder: undefined
            }

          return {
            user: x,
            reminder: reminder
          };
        }));
        unverifiedMembers.forEach(x => {
          if (x.reminder !== undefined)
            unverified.push(`<${x.user.id}> - Is already notified?: ${(x.reminder.notified ? "Yes" : "No")}`)
        });

        let content = unverified.join('\n');
        if (unverified.length <= 0 || reminders.length <= 0)
          content = this.getLanguageManager().translate("common.no_unverified")

        return await inter.reply({
          embeds: [
            {
              title: this.getLanguageManager().translate("common.unverified"),
              description: content
            }
          ],
          ephemeral: true
        })
      }
      case "purge": {
        unverifiedRole.members.forEach(x => {
          x.kick("Člen se neověřil ani po upomínce. (" + inter.member.displayName + ")")
        })

        return await inter.reply({
          content: this.getLanguageManager().translate("command.user.purged"),
          ephemeral: true
        })
      }
      case "clear-reminders": {
        const reminders = await Reminder.find()
        reminders.forEach(async x => await Reminder.deleteOne({ _id: x._id }))

        return await inter.reply({
          content: this.getLanguageManager().translate("command.user.reminder_cleared"),
          ephemeral: true
        })
      }
    }
  }
}

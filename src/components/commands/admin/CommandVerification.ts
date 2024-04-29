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
        const unverifiedMembers = await Promise.all(unverifiedRole.members.map(async x => {
          return {
            user: x,
            reminder: await Reminder.findOne({ memberId: x.id })
          };
        }));

        unverifiedMembers.forEach(x => {
          unverified.push(`<${x.user.id}> - Is already notified?: ${(x.reminder.notified ? "Yes" : "No")}`)
        });

        return await inter.reply({
          content: unverified.join('\n'),
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
    }
  }
}

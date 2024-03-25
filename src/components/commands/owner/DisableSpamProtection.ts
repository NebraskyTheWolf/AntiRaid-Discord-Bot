import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";

export default class DisableSpamProtection extends BaseCommand {
    public constructor() {
        super("disable", "Disable the spam protection", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction, member: GuildMember, guild: Guild) {
      this.instance.spamProtectionEnabled = false

      await inter.reply({
        content: 'Spam protection disabled.',
        ephemeral: true
      })
    }
}

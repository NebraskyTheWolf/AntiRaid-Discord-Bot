import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import {registerCommands} from "@fluffici.ts/utils/registerCommand";

export default class ForceResync extends BaseCommand {
    public constructor() {
        super("sync", "Re-sync the guild command index.", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction, member: GuildMember, guild: Guild) {
      await registerCommands(
        this.instance,
        guild.id,
        guild.name,
        this.instance.manager
      );

      await inter.reply({
        content: 'Command map reloaded with success.'
      })
    }
}

import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";

export default class CommandReload extends BaseCommand {
    public constructor() {
        super("reload", "Reload the application.", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction, member: GuildMember, guild: Guild) {
        this.instance.reload();
        return inter.followUp({
            content: "Reloading...",
            ephemeral: true
        }).then(m => setTimeout(() => {
          inter.reply({
            content: 'The application was reloaded with success.',
            ephemeral: true
          })
        }, 2 * 1000))
    }
}

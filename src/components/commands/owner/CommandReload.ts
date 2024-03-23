import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";

export default class CommandReload extends BaseCommand {
    public constructor() {
        super("reload", "Reload the application.", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction, member: GuildMember, guild: Guild) {
      this.reloadApplication();
      return this.sendFollowUpMessage(inter);
    }

    private reloadApplication() {
        this.instance.reload();
    }

    private async sendFollowUpMessage(inter: CommandInteraction) {
      const replyMessage = this.prepareReplyMessage();
      const delay = 2 * 1000;

      return setTimeout(() => {
        inter.reply(replyMessage);
      }, delay);
    }

    private prepareReplyMessage(): { content: string, ephemeral: boolean } {
        return {
            content: 'The application was reloaded with success.',
            ephemeral: true
        };
    }
}

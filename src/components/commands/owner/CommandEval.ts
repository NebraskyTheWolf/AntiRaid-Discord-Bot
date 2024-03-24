import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";

export default class CommandEval extends BaseCommand {
    public constructor() {
        super("eval", "Evaluating code", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      return new ModalHelper("row_code_evaluation", "Code evaluation.")
        .addTextInput(
          new TextInputComponent()
            .setCustomId("row_code")
            .setPlaceholder("instance.logger.info(\"UwU~ cookie time owo\")")
            .setLabel("CODE")
            .setStyle("LONG")
            .setMaxLength(4000)
        )
        .addTextInput(
          new TextInputComponent()
            .setCustomId("row_code_decorators")
            .setRequired(false)
            .setLabel("DECORATORS")
            .setMaxLength(512)
            .setStyle("LONG")
            .setPlaceholder("@muted")
        ).generate(inter);
    }
}

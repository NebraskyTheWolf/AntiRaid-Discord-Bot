import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";

export default class ContextBlacklist extends BaseContextMenu {

  public constructor() {
    super("Add to blacklist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {
    await this.getGuild(guild.id)

    await new ModalHelper(
      "row_blacklist_add",
      this.getLanguageManager().translate("context.modal.blacklist.add")
    ).addTextInput(
      new TextInputComponent()
        .setCustomId("row_blacklist_add_userid")
        .setStyle("SHORT")
        .setLabel("USER ID ( Do not edit )")
        .setDefaultValue(inter.targetId)
        .setMinLength(8)
        .setMaxLength(64)
        .setRequired(true)
    ).addTextInput(
      new TextInputComponent()
        .setCustomId("row_blacklist_add_reason")
        .setStyle("LONG")
        .setLabel(this.getLanguageManager().translate("common.reason"))
        .setMinLength(4)
        .setMaxLength(2000)
        .setPlaceholder(this.getLanguageManager().translate("context.modal.blacklist.description"))
        .setRequired(true)
    ).generate(inter);
      return true;
  }
}

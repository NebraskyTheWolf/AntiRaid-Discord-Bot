import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ContextWhitelist extends BaseContextMenu {

  public constructor() {
    super("Add to whitelist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {

      return false;
  }

}

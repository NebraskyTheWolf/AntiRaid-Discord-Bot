import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ContextWhitelistDel extends BaseContextMenu {

  public constructor() {
    super("Remove from whitelist", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {

      return false;
  }

}

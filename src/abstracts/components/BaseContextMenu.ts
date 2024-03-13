import Base from "../Base";
import {
  ContextMenuCommandBuilder
} from '@discordjs/builders'
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import {ApplicationCommandType} from "discord-api-types/v9";

export default abstract class BaseContextMenu extends Base {

  private readonly command: ContextMenuCommandBuilder

  protected constructor(name: string, options?: OptionMap<string, boolean>) {
    super(name, "", "CONTEXT");

    this.setOptions(options || new OptionMap<string, boolean>());

    this.command = new ContextMenuCommandBuilder();
    this.command.setName(this.name);
    this.command.setType(ApplicationCommandType.User)
    this.command.setDMPermission(this.options.get("dmPermission", false));
    this.command.setDefaultMemberPermissions(this.options.get("isProtected", false) ? 8 : undefined)
  }

  public abstract handler(inter: ContextMenuInteraction<'cached'>, member: GuildMember, guild: Guild): any

  public getCommand(): ContextMenuCommandBuilder {
    return this.command;
  }
}

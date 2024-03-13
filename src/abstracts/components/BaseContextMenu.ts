import Base from "../Base";
import {
  ContextMenuCommandBuilder
} from '@discordjs/builders'
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {CommandInteraction, ContextMenuInteraction, Guild, GuildMember} from "discord.js";

export default abstract class BaseContextMenu extends Base {

  private readonly command: ContextMenuCommandBuilder

  protected constructor(name: string, type: number = 2, options?: OptionMap<string, boolean>) {
    super(name, "", "CONTEXT");

    this.setOptions(options || new OptionMap<string, boolean>());

    this.command = new ContextMenuCommandBuilder();
    this.command.setName(this.name);
    this.command.setType(type)
    this.command.setDMPermission(this.options.get("dmPermission", false));
    this.command.setDefaultMemberPermissions(this.options.get("isProtected", false) ? 8 : undefined)
  }

  public abstract handler(inter: ContextMenuInteraction<'cached'>, member: GuildMember, guild: Guild): any

  public getCommand(): ContextMenuCommandBuilder {
    return this.command;
  }
}

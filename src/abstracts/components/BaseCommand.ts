import Base from "../Base";
import {
  SlashCommandBuilder,
  SlashCommandAttachmentOption,
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandUserOption,
  ToAPIApplicationCommandOptions,
} from '@discordjs/builders'
import OptionMap from "@fluffici.ts/utils/OptionMap";
import {CommandInteraction, Guild, GuildMember} from "discord.js";
import {PermissionFlagsBits} from "discord-api-types/v10";

export declare type Category = 'ADMINISTRATOR' | 'MODERATION' | 'OWNER' | 'DEFAULT';

export default abstract class BaseCommand extends Base {

    private readonly command: SlashCommandBuilder
    private readonly category: Category

    protected constructor(name: string, description?: string, options?: OptionMap<string, boolean>, category?: Category) {
        super(name, description, "COMMAND");

        this.setOptions(options || new OptionMap<string, boolean>());
        this.category = category || "DEFAULT";

        this.command = new SlashCommandBuilder();
        this.command.setName(this.name);
        this.command.setDescription(this.description);

        if (this.options.has("dmPermission")) {
          this.command.setDMPermission(this.options.get("dmPermission"));
        } else {
          this.command.setDMPermission(false);
        }

        if (this.options.has("isProtected")) {
            this.command.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        }

    }

    public abstract handler(inter: CommandInteraction, member: GuildMember, guild: Guild): any

    protected addAttachmentOption(handle: SlashCommandAttachmentOption): BaseCommand {
        this.command.addAttachmentOption(handle);
        return this;
    }

    protected addBooleanOption(handle: SlashCommandBooleanOption): BaseCommand {
        this.command.addBooleanOption(handle);
        return this;
    }

    protected addChannelOption(handle: SlashCommandChannelOption): BaseCommand {
        this.command.addChannelOption(handle);
        return this;
    }

    protected addIntegerOption(handle: SlashCommandIntegerOption): BaseCommand {
        this.command.addIntegerOption(handle);
        return this;
    }

    protected addStringOption(handle: SlashCommandStringOption): BaseCommand {
        this.command.addStringOption(handle);
        return this;
    }

    protected addMentionOption(handle: SlashCommandMentionableOption): BaseCommand {
        this.command.addMentionableOption(handle);
        return this;
    }

    protected addNumberOption(handle: SlashCommandNumberOption): BaseCommand {
        this.command.addNumberOption(handle);
        return this;
    }

    protected addRoleOption(handle: SlashCommandRoleOption): BaseCommand {
        this.command.addRoleOption(handle);
        return this;
    }

    protected addUserOption(handle: SlashCommandUserOption): BaseCommand {
        this.command.addUserOption(handle);
        return this;
    }

    protected addSubCommand(handle: SlashCommandSubcommandBuilder): SlashCommandSubcommandsOnlyBuilder {
        return this.command.addSubcommand(handle);
    }

    protected addSubGroup(handle: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandsOnlyBuilder {
        return this.command.addSubcommandGroup(handle);
    }

    public getCategory(): string {
        return this.category;
    }

    public getCommand(): SlashCommandBuilder {
        return this.command;
    }

    public getArgs(): ToAPIApplicationCommandOptions[] {
        return this.command.options
    }
}

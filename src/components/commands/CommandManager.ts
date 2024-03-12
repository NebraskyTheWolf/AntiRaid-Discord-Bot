import Logger from '@fluffici.ts/logger'
import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import { deleteCommand } from '@fluffici.ts/utils/registerCommand'
import { Collection } from 'discord.js'

import fs from 'fs';
import path from 'path';

export default class CommandManager {
  private REGISTRY: OptionMap<String, BaseCommand>;
  private logger: Logger;

  public readonly groups: OptionMap<String, String> = new OptionMap<String, String>()

  public constructor () {
    this.REGISTRY = new OptionMap<String, BaseCommand>();
    this.logger = new Logger("CommandRegistry");

    this.groups.add("ADMINISTRATOR", "Admin & Staff")
    this.groups.add("MODERATION", "Moderation commands")
    this.groups.add("DEFAULT", "Default commands")
    this.groups.add("OWNER", "Developer")
  }

  public registerCommands (): void {
    const commandDirs = [
      './admin',
      './moderation',
      './default',
      './owner'
    ];

    for (const dir of commandDirs) {
      const files = fs.readdirSync(path.resolve(__dirname, dir));

      for (const file of files) {
        if (!file.endsWith('.js')) continue;

        const Command = require(path.resolve(__dirname, dir, file));

        this.registerCommand(new Command());
      }
    }
  }

  /**
   * Registers a command in the command registry.
   *
   * @param {BaseCommand} base - The base command to register.
   *
   * @throws {Error} If the command with the same name is already registered.
   *
   * @returns {void}
   */
  public registerCommand (base: BaseCommand): void {
    if (this.REGISTRY.getMap().has(base.name))
      throw new Error("You can't register the same command at once.");
    if (base.options.get("isDisabled")) {
      this.logger.warn(`${base.name} is disabled.`);
    } else {
      this.REGISTRY.add(base.name, base);
      this.logger.info(`Command ${base.name} is now registered.`);
    }
  }

  public getCommand (name: string): BaseCommand {
    return this.REGISTRY.get(name);
  }

  public removeCommand (name: string): Boolean {
    this.logger.warn(`The handler of ${name} is now deleted.`);
    return this.REGISTRY.remove(name);
  }

  public reload () {
    this.REGISTRY.getMap().clear();
    deleteCommand();
    this.registerCommands();
  }

  public toMap (): Collection<String, BaseCommand> {
    return this.REGISTRY.getMap();
  }

  public toList () {
    return this.REGISTRY.getMap().map((value: BaseCommand) => {
      return {
        name: value.name,
        description: value.description || '',
        category: value.getCategory(),
        type: value.type,
        options: value.getArgs() || []
      }
    })
  }
}

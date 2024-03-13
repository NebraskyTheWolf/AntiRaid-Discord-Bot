import Logger from '@fluffici.ts/logger'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";

import { Collection } from 'discord.js'

import ContextBlacklist from "./admin/ContextBlacklist";
import ContextBlacklistDel from "./admin/ContextBlacklistDel";
import ContextWhitelist from "./admin/ContextWhitelist";
import ContextWhitelistDel from "./admin/ContextWhitelistDel";
import ContextShow from "./admin/ContextShow";

export default class ContextMenuManager {
  private REGISTRY: OptionMap<String, BaseContextMenu>;
  private logger: Logger;

  public constructor () {
    this.REGISTRY = new OptionMap<String, BaseContextMenu>();
    this.logger = new Logger("ContextMenu");
  }

  public registerContextMenu(): void {
    this.registerContext(new ContextBlacklist())
    this.registerContext(new ContextBlacklistDel())
    this.registerContext(new ContextWhitelist())
    this.registerContext(new ContextWhitelistDel())
    this.registerContext(new ContextShow())
  }

  /**
   * Registers a command in the command registry.
   *
   * @param {BaseContextMenu} base - The base command to register.
   * @throws {Error} If the command with the same name is already registered.
   * @returns {void}
   */
  public registerContext(base: BaseContextMenu): void {
    this.REGISTRY.add(base.name, base);
    this.logger.info(`ContextMenu ${base.name} is now registered.`);
  }

  public getContextMenu (name: string): BaseContextMenu {
    return this.REGISTRY.get(name);
  }

  public removeContext (name: string): Boolean {
    this.logger.warn(`The handler of ${name} is now deleted.`);
    return this.REGISTRY.remove(name);
  }

  public reload () {
    this.REGISTRY.getMap().clear();
    this.registerContextMenu();
  }

  public toMap(): Collection<String, BaseContextMenu> {
    return this.REGISTRY.getMap();
  }

  public toList () {
    return this.REGISTRY.getMap().map((value: BaseContextMenu) => {
      return {
        name: value.name,
        description: value.description || '',
        type: value.type
      }
    })
  }
}

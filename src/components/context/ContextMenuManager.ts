import Logger from '@fluffici.ts/logger'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";

import { Collection } from 'discord.js'
import ContextInfo from "./default/ContextInfo";

export default class ContextMenuManager {
  private REGISTRY: OptionMap<String, BaseContextMenu>;
  private logger: Logger;

  public constructor () {
    this.REGISTRY = new OptionMap<String, BaseContextMenu>();
    this.logger = new Logger("ContextMenu");
  }

  public registerContextMenu(): void {
    this.registerContext(new ContextInfo())
  }

  /**
   * Registers a command in the command registry.
   *
   * @param {BaseContextMenu} base - The base command to register.
   * @throws {Error} If the command with the same name is already registered.
   * @returns {void}
   */
  public registerContext(base: BaseContextMenu): void {
    if (this.REGISTRY.getMap().has(base.name))
      throw new Error("You can't register the same contextMenu at once.");
    if (base.options.get("isDisabled")) {
      this.logger.warn(`${base.name} is disabled.`);
    } else {
      this.REGISTRY.add(base.name, base);
      this.logger.info(`ContextMenu ${base.name} is now registered.`);
    }
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

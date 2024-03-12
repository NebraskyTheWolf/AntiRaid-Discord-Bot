import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { Guild } from "discord.js";
import { removeGuildCommands } from '@fluffici.ts/utils/registerCommand'

export default class GuildDeleteEvent extends BaseEvent {
    public constructor() {
        super("guildDelete", async (guild: Guild) => {

          // Prevent commands to remain on deletion
          await removeGuildCommands(
            this.instance,
            guild.id,
            guild.name,
            this.instance.manager
          )

          this.instance.logger.info(`${guild.id} kicked the application.`)
        });
    }
}

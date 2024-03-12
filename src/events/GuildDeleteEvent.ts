import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { Guild } from "discord.js";

export default class GuildDeleteEvent extends BaseEvent {
    public constructor() {
        super("guildDelete", async (guild: Guild) => {
          this.instance.logger.info(`${guild.id} kicked the application.`)
        });
    }
}

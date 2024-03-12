import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { registerCommands } from "@fluffici.ts/utils/registerCommand";
import { isNull } from "@fluffici.ts/types";
import { Guild as DGuild } from 'discord.js'
import Guild from '@fluffici.ts/database/Guild/Guild'

export default class GuildAddEvent extends BaseEvent {
    public constructor() {
        super("guildCreate", async (guild: DGuild) => {
            await this.registerGuildIfAbsent(guild)

            await registerCommands(
              this.instance,
              guild.id,
              guild.name,
              this.instance.manager
            );
        });
    }
  public async registerGuildIfAbsent(guild: DGuild): Promise<void> {
    const data = await Guild.findOne({ guildID: guild.id });

    if (isNull(data)) {
      await new Guild({
        guildID: guild.id,
        guildOwnerID: guild.ownerId,
      }).save()
      this.instance.logger.info(`New guild registered (${guild.id})`)
    }
  }
}

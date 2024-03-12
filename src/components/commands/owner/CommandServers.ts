import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'

export default class CommandServers extends BaseCommand {

    public constructor() {
        super("servers", "This command will show all the servers that use this application.",
            new OptionMap<string, boolean>().add("isProtected", true).add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
        const servers = this.instance.guilds.cache.map((guild, snowflake) =>
            `> ** ${guild.name} ** - ID: ${guild.id} - Owner: ${guild.ownerId}\n`
        ).join('');

        await inter.followUp({
            content: servers,
            ephemeral: true
        })
    }
}

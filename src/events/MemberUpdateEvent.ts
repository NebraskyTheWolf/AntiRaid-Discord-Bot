import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { Guild as DGuild, GuildMember, MessageEmbed, TextChannel } from "discord.js";

export default class MemberUpdateEvent extends BaseEvent {
    public constructor() {
        super("guildMemberUpdate", async (oldMember: GuildMember, newMember: GuildMember) => {

        });
    }
}

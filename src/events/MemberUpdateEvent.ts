import BaseEvent from "@fluffici.ts/components/BaseEvent";
import {GuildMember } from "discord.js";

export default class MemberUpdateEvent extends BaseEvent {
    public constructor() {
        super("guildMemberUpdate", async (oldMember: GuildMember, newMember: GuildMember) => {

        });
    }
}

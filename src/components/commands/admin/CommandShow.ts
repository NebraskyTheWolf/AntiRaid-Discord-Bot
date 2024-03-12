import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'

import { CommandInteraction, Guild, GuildMember } from 'discord.js'
import {SlashCommandUserOption} from "@discordjs/builders";
import {fetchMember} from "@fluffici.ts/types";

export default class CommandShow extends BaseCommand {

  public constructor() {
    super("show", "This command will show if a user is blacklisted and the details.", new OptionMap<string, boolean>()
        .add("isProtected", true)
        .add("isDeveloper", false),
      "ADMINISTRATOR"
    );

    this.addUserOption(
      new SlashCommandUserOption()
        .setName("user")
        .setDescription("Please select the user")
        .setRequired(true)
    )
  }

    async handler(inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
        const user = inter.options.getUser('user', true)
        const fMember = await fetchMember(guild.id, user.id);
        const [fGuild, blacklisted, localBlacklist] = await this.fetchRequiredData(fMember);

        const foundTitle = this.getLanguageManager().translate('command.show.found.title');
        const foundDesc = this.getLanguageManager().translate('command.show.found.description');
        const reason = this.getLanguageManager().translate('common.reason');
        const staff = this.getLanguageManager().translate('common.staff');

        if (blacklisted || localBlacklist) {
            return await inter.reply({
                embeds: this.buildBlackListEmbedMessage(fMember, blacklisted || localBlacklist, {
                    foundTitle,
                    foundDesc,
                    reason,
                    staff
                })
            });
        }

        const notFoundTitle = this.getLanguageManager().translate('command.show.not_found.title');
        const notFoundDesc = this.getLanguageManager().translate('command.show.not_found.description');

        return await inter.reply({
            embeds: this.buildEmbedMessage(fMember, {
                icon: 'success',
                color: 'GREEN',
                title: notFoundTitle,
                description: notFoundDesc
            })
        });
    }

    private buildBlackListEmbedMessage(fMember: GuildMember, blacklistData: any, translations: {
        foundTitle: string;
        foundDesc: string;
        reason: string;
        staff: string;
    }) {
        const {foundTitle, foundDesc, reason, staff} = translations;

        return this.buildEmbedMessage(fMember, {
            icon: 'ban',
            color: 'RED',
            title: foundTitle,
            description: foundDesc,
            fields: [
                {
                    name: 'ID',
                    value: blacklistData.userID,
                    inline: false
                },
                {
                    name: reason,
                    value: blacklistData.reason,
                    inline: false
                },
                {
                    name: staff,
                    value: blacklistData.staffName,
                    inline: false
                }
            ]
        });
    }
}

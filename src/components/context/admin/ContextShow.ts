import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ContextShow extends BaseContextMenu {

  public constructor() {
    super("Lookup", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild) {
    const user = inter.targetId

    const [fGuild, blacklisted, localBlacklist] = await this.fetchRequiredDataUser(guild.id, user);

    const foundTitle = this.getLanguageManager().translate('command.show.found.title', {id: user});
    const foundDesc = this.getLanguageManager().translate('command.show.found.description');
    const reason = this.getLanguageManager().translate('common.reason');
    const staff = this.getLanguageManager().translate('common.staff');

    if (blacklisted) {
      return await inter.reply({
        embeds: this.buildBlackListEmbedMessage(member, {
          userID: blacklisted.userID,
          reason: blacklisted.reason,
          staffName: blacklisted.staffName
        }, {
          foundTitle,
          foundDesc,
          reason,
          staff
        }),
        ephemeral: true
      });
    }

    if (localBlacklist) {
      return await inter.reply({
        embeds: this.buildBlackListEmbedMessage(member, {
          userID: localBlacklist.userID,
          reason: localBlacklist.reason,
          staffName: localBlacklist.staff
        }, {
          foundTitle,
          foundDesc,
          reason,
          staff
        }),
        ephemeral: true
      });
    }

    const notFoundTitle = this.getLanguageManager().translate('command.show.not_found.title', {id: user});
    const notFoundDesc = this.getLanguageManager().translate('command.show.not_found.description');

    return await inter.reply({
      embeds: this.buildEmbedMessage(member, {
        icon: 'success',
        color: 'GREEN',
        title: notFoundTitle,
        description: notFoundDesc
      }),
      ephemeral: true
    });
  }

  private buildBlackListEmbedMessage(fMember: GuildMember, blacklistData: { userID: string, reason: string, staffName: string }, translations: {
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

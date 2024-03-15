import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, CommandInteraction, MessageButton, MessageEmbed} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import {fetchMember} from "@fluffici.ts/types";
import LocalBlacklist from "@fluffici.ts/database/Common/LocalBlacklist";

export default class ConfirmButton extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_confirm', 'Confirm')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    const guild = await this.getGuild(interaction.guildId)

    const targetId: string = this.arguments.get('targetId')
    const ownerId: string = this.arguments.get('ownerId')
    const messageId: string = this.arguments.get('messageId')

    if (interaction.member.id !== ownerId) {
      return await this.respond(interaction, 'common.button.not_owned', 'common.button.not_owned.desc', 'RED', {}, 'error')
    }

    await interaction.channel.messages.cache.get(messageId).edit({
      embeds: [ this.message() ],
      components: [
        {
          type: 1,
          components: [
            new MessageButton()
              .setStyle(MessageButtonStyles.SUCCESS)
              .setLabel("Confirmed")
              .setDisabled(true)
              .setEmoji(this.getEmojisConfig().get('success'))
              .setCustomId(`row_confirm`)
          ]
        }
      ],
    })

    const global = await Blacklist.findOne({ userID: targetId })
    if (!global) {
      return await this.respond(interaction, 'command.blacklist.user_not_blacklisted_title', 'command.blacklist.user_not_blacklisted_description', 'RED', { user: targetId }, 'error')
    }

    await Blacklist.deleteOne({ userID: targetId })
    this.writeAuditLog(guild.guildID, interaction.member.id, "global_blacklist_removed", `Unblacklisted ${targetId}`)
    await this.handleLog(guild, interaction, targetId, 'remove', 'global')

    return await this.respond(interaction, 'command.blacklist.user_unblacklisted_title', 'command.blacklist.user_unblacklisted_description', 'GREEN')
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.SUCCESS)
      .setLabel("Confirm")
      .setEmoji(this.getEmojisConfig().get('warning'))
      .setCustomId(`row_confirm`);
  }

  message(): MessageEmbed {
    return new MessageEmbed(this.buildEmbedBody({
      icon: 'warning',
      title: 'Are you sure?',
      description: 'If you continue you will remove the blacklist of the selected user.',
      fields: []
    }));
  }

  async respond (inter: ButtonInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
    await inter.reply({
      embeds: this.buildEmbedMessage(inter.member, {
        icon: icon,
        color: color,
        title: this.getLanguageManager().translate(titleKey, args),
        description: this.getLanguageManager().translate(descKey, args)
      }),
      ephemeral: true
    })
  }

  async handleLog(guild: FGuild, inter: ButtonInteraction<'cached'>, user: string, type: string, log: string) {
    await this.sendLog(guild, await fetchMember(guild.guildID, user), (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user),
        await Blacklist.findOne({ userID: user }),
        await LocalBlacklist.findOne({ userID: user, guildID: inter.guildId })
      ));
  }
}

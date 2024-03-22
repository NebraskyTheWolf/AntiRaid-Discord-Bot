import BaseModal from "@fluffici.ts/components/BaseModal";

import { GuildMember, MessageEmbed } from "discord.js";
import { ModalSubmitInteraction } from "discord-modals";
import Verification from "@fluffici.ts/database/Guild/Verification";
import AcitivityHelper from "@fluffici.ts/utils/ActivityHelper";
import { updateVerification } from '@fluffici.ts/types'

export default class ModalVerificationDenied extends BaseModal {
    public constructor() {
        super("row_verification_denied");
    }

    public async handler(interaction: ModalSubmitInteraction): Promise<void> {
      await this.getGuild(interaction.guildId)
      const member: GuildMember = interaction.guild.members.cache.get(interaction.getTextInputValue("row_user_id"))
      const reason: string = interaction.getTextInputValue("row_reasons")

      await member.send({
        embeds: [
          new MessageEmbed()
            .setAuthor(this.getLanguageManager().translate("verification.result.failed.author", {
              author: interaction.guild.name
            }))
            .setTitle(this.getLanguageManager().translate("verification.result.failed.title"))
            .setDescription(this.getLanguageManager().translate("verification.result.failed.description"))
            .addField(this.getLanguageManager().translate("common.reason"), `${reason}}`)
        ]
      })

      await Verification.updateOne({
        guildId: interaction.guildId,
        memberId: member.id,
        status: 'pending'
      }, {
        $set: {
          issuerId: interaction.member.id,
          issuerName: interaction.member.user.username,
          status: 'denied',
          updatedAt: Date.now()
        }
      }, {
        upsert: false
      })

      await new AcitivityHelper()
        .setOwner(interaction.member.id)
        .setType("VERIFICATION_DENIED")
        .setContent(`${member.user.username} has been denied for ${reason}.`)
        .save(interaction.guildId)

      await updateVerification(member, this.getLanguageManager().translate("verification.result.failed.denied.admin"))

      await interaction.reply({
        content: `Member ${member.user.username} : verification denied.`,
        ephemeral: true
      })
    }
}

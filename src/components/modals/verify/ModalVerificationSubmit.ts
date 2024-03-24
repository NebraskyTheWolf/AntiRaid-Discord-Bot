import Verification from "@fluffici.ts/database/Guild/Verification";
import BaseModal from "@fluffici.ts/components/BaseModal";
import { MessageEmbed, TextChannel } from "discord.js";
import { ModalSubmitInteraction } from "discord-modals";
import Interaction from '@fluffici.ts/database/Guild/Interaction'
import {getAmountOfDays, isNull} from "@fluffici.ts/types";

export default class ModalVerificationSubmit extends BaseModal {
    public constructor() {
        super("row_verification_submit");
    }

    public async handler(interaction: ModalSubmitInteraction): Promise<void> {
        await this.getGuild(interaction.guildId)
        const channel: TextChannel = interaction.guild.channels.cache.get('1220695667887046677') as TextChannel;
        const memberId: string = interaction.member.user.id;

        const one: string = interaction.getTextInputValue("row_verification_answer_one");
        const two: string = interaction.getTextInputValue("row_verification_answer_two");
        const three: string = interaction.getTextInputValue("row_verification_answer_three");
        const four: string = interaction.getTextInputValue("row_verification_answer_four");

      const yes = this.getLanguageManager().translate('common.yes');
      const no = this.getLanguageManager().translate('common.no');

      const [
        guild,
        blacklisted,
        localBlacklist,
      ] = await this.fetchRequiredData(interaction.member)

      const embed = new MessageEmbed()
        .setColor("ORANGE")
        .setAuthor(this.getLanguageManager().translate("verification.enforced.author"), this.instance.user.avatarURL({ format: 'png' }))
        .setTitle(this.getLanguageManager().translate("verification.enforced.title", {
          appName: 'FurRaidDB - '
        }))
        .setDescription(`**Jste furry? Pokud ano, popište nám vaši fursonu (není pravidlem pro připojení):** \`\`\`${one}\`\`\` ** Napište pár slov o sobě:** \`\`\`${two}\`\`\` **Jaký máte vztah k furry komunitě?:** \`\`\`${three}\`\`\` **Jak jste našli náš server?:** \`\`\`${four}\`\`\``)
        .addField(this.getLanguageManager().translate("verification.enforced.username"), `${interaction.user.username}`, true)
        .addField(this.getLanguageManager().translate("verification.enforced.discriminator"), `${interaction.user.discriminator}`, true)
        .addField("ID", `${interaction.user.id}`, true)
        .addField(this.getLanguageManager().translate('common.joined'), getAmountOfDays(interaction.user.createdAt) + ' ' + this.getLanguageManager().translate('common.days'), true)
        .addField(this.getLanguageManager().translate('common.globally_blacklisted'), `${isNull(blacklisted) ? no : yes}`, false)
        .addField(this.getLanguageManager().translate('common.locally_blacklisted'), `${isNull(localBlacklist) ? no : yes}`, false)
        .setThumbnail(`https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`);
      let interactionId: string ;

      await new Verification({
        guildId: interaction.guildId,
        memberId: memberId,
        memberName: interaction.user.username,
        registeredAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        expireAt: 86400,
        answers: [
          {
            title: "Jste furry? Pokud ano, popište nám vaši fursonu (není pravidlem pro připojení)",
            content: one
          },
          {
            title: "Napište pár slov o sobě",
            content: two
          },
          {
            title: "Jaký máte vztah k furry komunitě?",
            content: three
          },
          {
            title: "Jak jste našli náš server?",
            content: four
          }
        ]
      }).save().then(r => interactionId = r._id)

      await channel.send({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                custom_id: 'row_verification_update',
                placeholder: 'Verification options',
                max_values: 1,
                options: [
                  { label: 'Ověřit', value: `accepted:${memberId}`, emoji: { name: 'checks', id: '1216864324044198049' } },
                  { label: 'Zamítnout', value: `refused:${memberId}`, emoji: { name: 'error', id: '1216864548200386712' } },
                  { label: 'Ban', value: `banned:${memberId}`, emoji: { name: 'ban', id: '1216864274253746268' } },
                ],
                type: 3
              }
            ]
          }
        ]
      }).then(r => {
        new Interaction({
          guildId: interaction.guildId,
          memberId: interaction.member.id,
          interactionId: interactionId,
          messageId: r.id,
          deleted: false
        }).save().catch(err => console.error(err))
      });

      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(this.getLanguageManager().translate("verification.enforced.sent"))
            .setDescription(this.getLanguageManager().translate("verification.enforced.description"))
            .setColor("DARK_VIVID_PINK")
        ],
        ephemeral: true
      });
    }
}

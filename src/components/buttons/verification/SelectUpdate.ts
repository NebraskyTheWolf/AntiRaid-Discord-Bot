import {
  MessageSelectMenu,
  MessageEmbed,
  Role,
  SelectMenuInteraction,
  GuildMember, TextChannel
} from "discord.js";
import BaseButton from "@fluffici.ts/components/BaseButton";
import {updateVerification} from '@fluffici.ts/types'
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import { TextInputComponent } from "discord-modals";
import Verification from "@fluffici.ts/database/Guild/Verification";
import AcitivityHelper from "@fluffici.ts/utils/ActivityHelper";

export default class SelectUpdate extends BaseButton<MessageSelectMenu, void> {
    public constructor() {
        super(
            "row_verification_update",
            "Verify"
        );
    }

    public async handler(interaction: SelectMenuInteraction<"cached">): Promise<void> {
      await this.getGuild(interaction.guildId)

      const split: string[] = interaction.values[0].split(':')
      const type: string = split[0]
      const member: GuildMember = interaction.guild.members.cache.get(split[1])
      const unverifiedRole: Role = interaction.guild.roles.cache.get('606542004708573219');
      const verifiedRole: Role = interaction.guild.roles.cache.get('606542137819136020');

      switch (type) {
        case "accepted": {
          await member.roles.remove(unverifiedRole);
          await member.roles.add(verifiedRole);

          await member.send({
            embeds: [
              new MessageEmbed()
                .setAuthor(this.getLanguageManager().translate("verification.accepted.author", {
                  author: 'Fluffici'
                }))
                .setTitle(this.getLanguageManager().translate("verification.accepted.title", {
                  server: 'FurRaidDB - '
                }))
                .setDescription(this.getLanguageManager().translate("verification.accepted.description"))
                .addField("Member count", `${interaction.guild.memberCount}`)
            ],
            components: [
              {
                type: 1,
                components: [
                  this.instance.buttonManager.createLinkButton("Rules", "https://discord.com/channels/606534136806637589/606556413183000671")
                ]
              }
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
              status: 'verified',
              updatedAt: Date.now()
            }
          }, {
            upsert: false
          })

          const form = await Verification.findOne({
            guildId: interaction.guildId,
            memberId: member.id,
            status: 'verified'
          })

          const embed = new MessageEmbed()
            .setColor("ORANGE")
            .setAuthor(this.getLanguageManager().translate("verification.enforced.verified"), this.instance.user.avatarURL({format: 'png'}))
            .setDescription(`**Jste furry? Pokud ano, popište nám vaši fursonu (není pravidlem pro připojení):** \`\`\`${form.answers[0].content}\`\`\` ** Napište pár slov o sobě:** \`\`\`${form.answers[1].content}\`\`\` **Jaký máte vztah k furry komunitě?:** \`\`\`${form.answers[2].content}\`\`\` **Jak jste našli náš server?:** \`\`\`${form.answers[3].content}\`\`\``)
            .addField("Username", member.user.username, false)
            .setThumbnail(`https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.jpeg`);

          const verifLog = interaction.guild.channels.cache.get("963133802316714066") as TextChannel
          verifLog.send({embeds: [embed]})

          const embedGeneral = new MessageEmbed()
            .setColor("GREEN")
            .setTitle(`<:gchecks:1220755094673293343> ${member.user.displayName} byl právě ověřen!`)
            .setDescription(`Přivítejte ho mezi Fluffíky! :green_heart:`)
            .setThumbnail(`https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.jpeg`);

          const general = interaction.guild.channels.cache.get("606534136806637594") as TextChannel
          general.send({embeds: [embedGeneral]})

          await new AcitivityHelper()
            .setOwner(interaction.member.id)
            .setType("VERIFICATION_GRANTED")
            .setContent(`${member.user.username} verification confirmed.`)
            .save(interaction.guildId)

          await interaction.reply({
            content: `Member ${member.user.username} is now verified.`,
            ephemeral: true
          })

          await updateVerification(member, 'Žádost schválena ' + interaction.user.tag)
        }
          break
        case "refused": {
          await new ModalHelper("row_verification_denied", "Updating " + member.user.username + " Request.")
            .addTextInput(
              new TextInputComponent()
                .setCustomId("row_reasons")
                .setPlaceholder("Please set a correct reason.")
                .setLabel("Reason")
                .setStyle("LONG")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(200)
            ).addTextInput(
              new TextInputComponent()
                .setCustomId("row_user_id")
                .setLabel("USER ID ( DO NOT EDIT )")
                .setStyle("SHORT")
                .setRequired(true)
                .setDefaultValue(member.id)
            ).generate(interaction)
        }
          break
        case "banned": {
          await Verification.updateOne({
            guildId: interaction.guildId,
            memberId: member.id,
            status: 'pending'
          }, {
            $set: {
              issuerId: interaction.member.id,
              issuerName: interaction.member.user.username,
              status: 'banned',
              updatedAt: Date.now()
            }
          }, {
            upsert: false
          })

          await new AcitivityHelper()
            .setOwner(interaction.member.id)
            .setType("VERIFICATION_GRANTED")
            .setContent(`${member.user.username} confirmed.`)
            .save(interaction.guildId)

          member.ban({reason: 'Banned on verification. '})

          await interaction.reply({
            content: `You Banned ${member.user}`,
            ephemeral: true
          })

          await updateVerification(member, 'Banned by ' + interaction.member.displayName)
        }
          break
      }
    }

    public generate(): MessageSelectMenu {
        return new MessageSelectMenu();
    }

    public message(): MessageEmbed {
        return new MessageEmbed();
    }
}

import BaseCommand from "@fluffici.ts/components/BaseCommand";
import BaseEvent from "@fluffici.ts/components/BaseEvent";
import BaseButton from "@fluffici.ts/components/BaseButton";
import Developer from "@fluffici.ts/database/Security/Developer";

import {
  ButtonInteraction,
  CommandInteraction,
  GuildMember,
  Interaction,
  TextChannel
} from 'discord.js'

export default class InteractionEvent extends BaseEvent {
  public constructor () {
    super('interactionCreate', async (interaction: Interaction<"cached">) => {
      try {
        if (!this.instance.loaded) {
          return this.replyToInteraction(interaction, 'Please wait, my code is loading.')
        }

        const developer = await Developer.findOne({ userId: interaction.member.id })

        if (interaction.isCommand()) {
          await this.handleCommandInteraction(interaction, developer)
        } else if (interaction.isButton() || interaction.isSelectMenu()) {
          await this.handleButtonInteraction(interaction as ButtonInteraction<'cached'>, developer)
        }
      } catch (err) {
        this.instance.logger.error(`InteractionEvent:(${interaction.id}) | ${err}`)
        return this.replyToInteraction(interaction, 'Error occurred while executing interaction.')
      }
    })
  }

  private replyToInteraction (interaction: Interaction<'cached'>, message: string) {
    return (interaction as CommandInteraction).reply({
      content: message,
      ephemeral: true
    })
  }

  private handleCommandInteraction (interaction: CommandInteraction<'cached'>, developer: any) {
    const commandName: string = interaction.commandName
    const handler: BaseCommand = this.instance.manager.getCommand(commandName)
    if (!handler) return

    if (handler.options.get('isDeveloper') && developer) {
      return handler.handler(interaction, interaction.member as GuildMember, interaction.guild)
    }
    if (handler.options.get('isDeveloper') && !developer) {
      return this.replyToInteraction(interaction, 'Only my developers can execute this command.')
    }

    if (handler.options.get('isProtected') && interaction.member.permissions.has('ADMINISTRATOR')) {
      return handler.handler(interaction, interaction.member as GuildMember, interaction.guild)
    }
    if (handler.options.get('isProtected') && !interaction.member.permissions.has('ADMINISTRATOR')) {
      return this.replyToInteraction(interaction, 'Sorry, you need to be Moderator to execute this command')
    }

    return handler.handler(interaction, interaction.member as GuildMember, interaction.guild)
  }

  private handleButtonInteraction (interaction: ButtonInteraction<'cached'>, developer: any) {
    const customId: string = interaction.customId
    const handler: BaseButton<unknown, unknown> = this.instance.buttonManager.getButton(customId)
    if (!handler) return

    if (handler.setting.get('isDynamic') && handler.setting.get('ownerId') === interaction.member.id) {
      return handler.handler(interaction)
    }
    if (handler.setting.get('isDynamic') && handler.setting.get('ownerId') !== interaction.member.id) {
      return this.replyToInteraction(interaction, 'You are not allowed to click on this button.')
    }

    if (handler.setting.get('isProtected') && developer) {
      return handler.handler(interaction)
    }
    if (handler.setting.get('isProtected') && !developer) {
      return this.replyToInteraction(interaction, 'You are not allowed to click on this button.');
    }

    return handler.handler(interaction);
  }
}

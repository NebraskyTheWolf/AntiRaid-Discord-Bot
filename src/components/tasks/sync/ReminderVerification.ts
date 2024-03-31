
import BaseTask from "@fluffici.ts/components/BaseTask";
import {fetchDGuild, fetchMember, fetchSyncMember} from "@fluffici.ts/types";
import Reminder from "@fluffici.ts/database/Security/Reminder";
import {GuildMember, MessageButton, TextChannel} from "discord.js";
import Verification from "@fluffici.ts/database/Guild/Verification";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";
import moment from 'moment/moment'

export default class ReminderVerification extends BaseTask {
  public constructor() {
    super("ReminderVerification", "Syncing all new entries from the dashboard", 160,
      async () => {
        const guild = await this.getGuild(this.getDefaultConfig().get('main-guild'))
        const discordGuild = await fetchDGuild(guild.guildID)

        const role = discordGuild.roles.cache.find(role => role.id === "606542004708573219");

        if (!this.instance.spamProtectionEnabled) {
          this.instance.logger.warn("ReminderVerification disabled by developer.")
          return;
        }

        const reminder = await Reminder.find()

        this.instance.logger.warn("ReminderVerification Running job.")
        this.instance.logger.warn(`Members: ${role.members.size}`)
        this.instance.logger.warn(`Reminders: ${reminder.length}`)

        const now = new Date();
        role.members.map(async m => {
          if (m.user.bot || m.user.system)
            return;

          const reminders = await Reminder.findOne({
            memberId: m.id,
            locked: false,
            notified: false
          });

          let currentVerification = await Verification.findOne({
            memberId: m.id
          })

          if (reminders) {
            if (!currentVerification) {
              let hours = moment().diff(moment(m.joinedTimestamp), 'hours');
              if (!reminders.locked && hours >= 24) {
                try {
                  this.instance.logger.warn("First reminder sent to " + m.id)
                  await this.sendFirstReminder(m);
                } catch (e) {
                  this.instance.logger.warn("Cannot send message to " + m.id + " because they disabled their private messages.")
                }
                reminders.reminders = now.getTime();
                reminders.locked = true;
                await reminders.save();
              } else {
                this.instance.logger.warn("Reminder already sent or it's too early " + m.id)
                this.instance.logger.warn(hours  + " hours " + m.id)
                this.instance.logger.warn("---")
              }
            } else {
              this.instance.logger.warn("Deleting reminder for user because they completed the verification form.")
              await Reminder.deleteOne({
                memberId: m.id
              })
            }
          }
        })

        this.instance.logger.warn("Checking locked reminder.")

        const remindersLockeds = await Reminder.find({
          locked: true,
          notified: false
        });

        let memberArray = [];

        for (const reminderLocked of remindersLockeds) {
          let member = fetchSyncMember(guild.guildID, reminderLocked.memberId)
          let hours = moment().diff(moment(member.joinedTimestamp), 'hours');

          if (hours >= 72) {
            memberArray.push(`<@${reminderLocked.memberId}>`)
            this.instance.logger.warn("Pushing locked reminder")
            reminderLocked.notified = true;
            await reminderLocked.save();
          }
        }

        if (memberArray.length > 0) {
          this.instance.logger.warn("Sending kick log.")
          await this.handleRaidLog(memberArray)
          memberArray.length = 0;
        } else {
          this.instance.logger.warn("No locked reminder.")
        }
      })
  }

  private async handleRaidLog(memberArray= []) {
    const announcementChannel = this.instance.guilds.cache
      .get("606534136806637589").channels.cache
      .get("803067472621600859") as TextChannel;

    let confirmButton = this.instance.buttonManager.getButton("row_cancel_bulk_kick");
    let cancelButton = this.instance.buttonManager.getButton("row_confirm_bulk_remind");

    await announcementChannel.send({
      embeds: [
        {
          title: "FurRaidDB - Verification timed-out.",
          description: `${memberArray.join(', ')} has not verified in the time period.`,
          timestamp: Date.now()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            confirmButton.generate() as MessageButton,
            cancelButton.generate() as MessageButton,
          ]
        }
      ]
    });
  }

  async sendFirstReminder(member: GuildMember) {
    await member.send({
      embeds: [
        {
          title: `Připomenutí ověření.`,
          description: `
            Zdravíme tě, <:FoxBlanket:1108033370329448458>!⏰ Uběhlo **${new Date(member.joinedTimestamp).getHours()} hodin** od doby, co ses prvně připojil/a/i na server. Aby se ti server odemknul, musíš se prvně ověřit.\n\n
            Rádi bychom tě upozornili, že máš 48 hodin na to dokončit proces ověření než budeš automaticky odebrán ze serveru. A to by byla škoda, nu? 🦊🦊🦊\n\n
            Nemáš se čeho bát - ověření je jednoduché a zabere ti pár minut. To ti slibujeme. K ověření se dostaneš pomocí tlačítka u této zprávy. \n\n
            Děkujeme!
          `,
          footer: {
            text: "FurRaidDB",
            iconURL: this.instance.user.avatarURL({ format: 'png' })
          },
          timestamp: Date.now()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            this.instance.buttonManager.createLinkButton("Ověřit nyní", "https://discord.com/channels/606534136806637589/1220790179749560320")
          ]
        }
      ]
    })
  }
}

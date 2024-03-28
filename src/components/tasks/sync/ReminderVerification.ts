
import BaseTask from "@fluffici.ts/components/BaseTask";
import {fetchDGuild, fetchMember} from "@fluffici.ts/types";
import Reminder from "@fluffici.ts/database/Security/Reminder";
import {GuildMember, MessageButton, TextChannel} from "discord.js";
import Verification from "@fluffici.ts/database/Guild/Verification";
import {Guild as FGuild} from "@fluffici.ts/database/Guild/Guild";

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

        this.instance.logger.warn("ReminderVerification Running job.")

        role.members.map(async m => {

          const now = new Date();
          const reminders = await Reminder.find({
            memberId: m.id,
            locked: false,
            notified: false
          });

          let currentVerification = await Verification.findOne({
            memberId: m.id
          })

          if (!currentVerification) {
            for (const reminder of reminders) {
              // 1 reminder sent @ 24 hour intervals
              if (reminder.reminders.length < 1) {
                const lastReminderSent = reminder.reminders[reminder.reminders.length - 1];
                // 24 hours in milliseconds is 86400000
                if (!lastReminderSent || now.getTime() - lastReminderSent.getTime() > 86400000) {

                  this.instance.logger.warn("First reminder sent to " + m.id)

                  await this.sendFirstReminder(m, now.getTime() - lastReminderSent.getTime());

                  reminder.reminders.push(now);
                  reminder.locked = true;
                  await reminder.save();
                }
              }
            }

            const remindersLocked = await Reminder.find({
              memberId: m.id,
              locked: true,
              notified: false
            });

            let memberArray = [];

            for (const reminderLocked of remindersLocked) {
              const lastReminderSent = reminderLocked.reminders[reminderLocked.reminders.length - 1];
              // 3 days in milliseconds is 259200000
              if (!lastReminderSent || now.getTime() - lastReminderSent.getTime() > 259200000) {
                memberArray.push(reminderLocked.memberId)

                reminderLocked.notified = true;
                await reminderLocked.save();
              }
            }

            if (memberArray.length > 0) {
              this.instance.logger.warn("Sending kick log.")
              this.handleRaidLog(memberArray, guild)
              memberArray.length = 0;
            }

          } else {
            this.instance.logger.warn("Deleting reminder for user because they completed the verification form.")
            // Delete the reminder once the member has completed the verification form.
            await Reminder.deleteOne({
              memberId: m.id
            })
          }
      })
    })
  }

  private async handleRaidLog(memberArray= [], guild: FGuild) {
    const announcementChannel = this.instance.guilds.cache
      .get(guild.guildID).channels.cache
      .get(guild.logChannelID) as TextChannel;


    const affectedMembers = memberArray.map(async x => {
      const member = await fetchMember(guild.guildID, x);
      return member.displayName
    })

    // Anti spam safety feature.
    if (affectedMembers.length <= 0)
      return;

    let confirmButton = this.instance.buttonManager.getButton("row_confirm_bulk_kick");
    let cancelButton = this.instance.buttonManager.getButton("row_cancel_bulk_remind");

    await announcementChannel.send({
      embeds: [
        {
          title: "FurRaidDB - Verification timed-out.",
          description: `${affectedMembers.join(', ')} has not verified in the time period.`,
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

  async sendFirstReminder(member: GuildMember, remainingTime: number) {
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

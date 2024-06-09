
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
        const guildConfig = this.getDefaultConfig().get('main-guild');
        const guild = await this.getGuild(guildConfig);
        const discordGuild = await fetchDGuild(guild.guildID);

        const role = discordGuild.roles.cache.find(role => role.id === "606542004708573219");

        if (!this.instance.spamProtectionEnabled) {
          this.instance.logger.warn("ReminderVerification disabled by developer.");
          return;
        }

        const reminders = await Reminder.find();

        this.instance.logger.warn("ReminderVerification Running job.");
        this.instance.logger.warn(`Members: ${role.members.size}`);
        this.instance.logger.warn(`Reminders: ${reminders.length}`);

        const now = new Date();

        await Promise.all(role.members.map(async (member) => {
          if (!member || member.user.bot || member.user.system) {
            return;
          }

          const reminder = await Reminder.findOne({
            memberId: member.id,
            locked: false,
            notified: false
          });

          const currentVerification = await Verification.findOne({
            memberId: member.id
          });

          if (reminder) {
            if (!currentVerification) {
              const hours = moment().diff(moment(member.joinedTimestamp), 'hours');
              if (!reminder.locked && hours >= 24) {
                try {
                  this.instance.logger.warn("First reminder sent to " + member.id);
                  await this.sendFirstReminder(member);
                } catch (e) {
                  this.instance.logger.warn("Cannot send message to " + member.id + " because they disabled their private messages.");
                }
                reminder.reminders = now.getTime();
                reminder.locked = true;
                await reminder.save();
              } else {
                this.instance.logger.warn("Reminder already sent or it's too early " + member.id);
                this.instance.logger.warn(hours + " hours " + member.id);
                this.instance.logger.warn("---");
              }
            } else {
              this.instance.logger.warn("Deleting reminder for user because they completed the verification form.");
              await Reminder.deleteOne({
                memberId: member.id
              });
            }
          }
        }));

        this.instance.logger.warn("Checking locked reminders.");

        const lockedReminders = await Reminder.find({
          locked: true,
          notified: false
        });

        const memberArray = [];

        for (const lockedReminder of lockedReminders) {
          let member;
          try {
            member = fetchSyncMember(guild.guildID, lockedReminder.memberId);
          } catch (e) {
            this.instance.logger.warn(`Member ${lockedReminder.memberId} left the server.`);
            continue;
          }

          // Ignoring if the member left the server OR if the member got the verified role.
          if (!member || member.roles.cache.has("606542137819136020")) {
            continue;
          }

          const hours = moment().diff(moment(member.joinedTimestamp), 'hours');

          if (hours >= 72) {
            memberArray.push(`<@${lockedReminder.memberId}>`);
            this.instance.logger.warn("Pushing locked reminder");
            lockedReminder.notified = true;
            await lockedReminder.save();
          }
        }

        if (memberArray.length > 0) {
          this.instance.logger.warn("Sending kick log.");
          await this.handleRaidLog(memberArray);
          memberArray.length = 0;
        } else {
          this.instance.logger.warn("No locked reminders.");
        }
      }
    );
  }

  private async handleRaidLog(memberArray: string[]) {
    const announcementChannel = this.instance.guilds.cache
      .get("606534136806637589")?.channels.cache
      .get("803067472621600859") as TextChannel;

    const confirmButton = this.instance.buttonManager.getButton("row_cancel_bulk_kick");
    const cancelButton = this.instance.buttonManager.getButton("row_confirm_bulk_remind");

    await announcementChannel.send({
      embeds: [
        {
          title: "FurRaidDB - Verification timed-out.",
          description: `${memberArray.join(', ')} has not verified in the time period.`,
          timestamp: new Date()
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

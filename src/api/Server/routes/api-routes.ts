import Fluffici from "@fluffici.ts";
import AbstractRoutes from "../../Server/AbstractRoutes";
import {Request, Response} from "express";
import path from "path";
import fs from "node:fs";
import guild from "@fluffici.ts/database/Guild/Guild";

export interface Statistics {
    guilds: number;
    users: number;
    commands: number;
}

export default class ApiRoutes extends AbstractRoutes {
    public selfRegister() {
        this.getRouter().get('/cmd', this.getCmdHandler.bind(this))
        this.getRouter().get('/invite', this.getInviteHandler.bind(this))
        this.getRouter().get('/stats', this.getStatsHandler.bind(this))
        this.getRouter().get('/transcripts/:id', this.getTranscriptHandler.bind(this))
        this.getRouter().get('/intercept/:channelId/:messageId', this.interceptMessage.bind(this))
        this.getRouter().get('/get-servers', this.getAllServers.bind(this))
        this.getRouter().get('/servers/:id/members', this.getAllMembers.bind(this))
    }

    private async getCmdHandler(req: Request, res: Response) {
        const data = Fluffici.instance.manager.toList();
        this.sendSuccessResponse(res, data);
    }

  private async getAllServers(req: Request, res: Response) {
    const guilds = Array.from(Fluffici.instance.guilds.cache.values());

    // Serialize the guild data
    const serializedGuilds = guilds.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ format:  'png' }),
      ownerId: guild.ownerId,
      memberCount: guild.memberCount,
      afkChannelId: guild.afkChannelId,
      afkTimeout: guild.afkTimeout,
      joinedAt: guild.joinedAt,
      large: guild.large,
      maximumMembers: guild.maximumMembers,
      maximumPresences: guild.maximumPresences,
      premiumTier: guild.premiumTier,
      verificationLevel: guild.verificationLevel,
    }));

    this.sendSuccessResponse(res, serializedGuilds);
  }

  private async getAllMembers(req: Request, res: Response) {
      const guildId = req.params.id;
      const guild = Fluffici.instance.guilds.cache.get(guildId);

      if (guild) {
          const members = Array.from(guild.members.cache.values());

          // Serialize the member data
          const serializedMembers = members.map(member => ({
              id: member.id,
              username: member.user.username,
              discriminator: member.user.discriminator,
              avatar: member.user.avatarURL({ format: 'png' }),
              joinedAt: member.joinedAt,
              roles: Array.from(member.roles.cache.values()).map(role => ({
                  id: role.id,
                  name: role.name,
                  color: role.color,
                  position: role.position,
              })),
              isSpam: (member.flags.bitfield & (1 << 20)) !== 0
          }));

          this.sendSuccessResponse(res, serializedMembers);
      } else {
        this.sendSuccessResponse(res, []);
      }
  }

    private async getInviteHandler(req: Request, res: Response) {
        const data = {
            invite_url: `https://discord.com/api/oauth2/authorize?client_id=${Fluffici.instance.application.id}&permissions=23427300781831&scope=bot`
        };
        this.sendSuccessResponse(res, data);
    }

  /**
   * Intercepts a message from a specified channel.
   *
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   * @return {Promise<void>} - A promise that resolves when the interception is completed.
   */
  private async interceptMessage(req: Request, res: Response): Promise<void> {
      const channelId = req.params.channelId;
      const messageId = req.params.messageId;

      const channel = await Fluffici.instance.channels.fetch(channelId);
      if (channel?.isText()) {
          const message = await channel.messages.fetch(messageId);
          if (message) {
            res.status(200).json({
              status: true,
              data: {
                giftsCodes: message.giftCodes ?? [],
                message: message
              }
            }).end()
          } else {
              res.status(404).json({
                  status: false,
                  error: 'MESSAGE_NOT_FOUND',
                  message: 'The message does not exist in the specified channel.',
              });
          }
      } else {
          res.status(400).json({
              status: false,
              error: 'INVALID_CHANNEL',
              message: 'The specified channel is not a text channel.',
          });
      }
  }

    private async getTranscriptHandler(req: Request, res: Response) {
      if (!req.params.id) {
        return res.json({
          status: false,
          error: 'MISSING_ARGUMENTS',
          message: 'The transcript_files id is missing.'
        })
      }

      const filePath = path.join(__dirname, '..', '..', '..', '..', 'data', 'transcripts', `transcript-${req.params.id}.html`);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath)
      } else {
        return res.json({
          status: false,
          error: 'FILE_NOT_FOUND',
          message: 'The transcript_files file does not exist.'
        });
      }
    }

    private async getStatsHandler(req: Request, res: Response) {
        const exists = await this.cacheManager.exists("statistics");

        if (exists) {
            const data = await this.cacheManager.getObject<Statistics>("statistics");
            const response = {
                metadata: {
                    objectId: data.objectId,
                    cachedAt: data.cachedAt,
                },
                data: data.data,
            };
            this.sendSuccessResponse(res, response);
        } else {
            const newStats = {
                guilds: Fluffici.instance.guilds.cache.size,
                users: Fluffici.instance.users.cache.size,
                commands: Fluffici.instance.manager.toList().length,
            };
            const result = await this.cacheManager.addObject<Statistics>("statistics", newStats, 300);
            this.sendSuccessResponse(res, result);
        }
    }
}

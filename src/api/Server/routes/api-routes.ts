import Fluffici from "@fluffici.ts";
import AbstractRoutes from "../../Server/AbstractRoutes";
import {Request, Response} from "express";
import path from "path";
import fs from "node:fs";

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
    }

    private async getCmdHandler(req: Request, res: Response) {
        const data = Fluffici.instance.manager.toList();
        this.sendSuccessResponse(res, data);
    }

    private async getInviteHandler(req: Request, res: Response) {
        const data = {
            invite_url: `https://discord.com/api/oauth2/authorize?client_id=${Fluffici.instance.application.id}&permissions=23427300781831&scope=bot`
        };
        this.sendSuccessResponse(res, data);
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

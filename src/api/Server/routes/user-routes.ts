import AbstractRoutes, {ErrorType} from "../../Server/AbstractRoutes";
import {Request, Response} from "express";
import {fetchDGuild, fetchGuild, fetchUser, getAmountOfDays, isNull} from "@fluffici.ts/types";
import {Snowflake} from "discord.js";
import guild from "@fluffici.ts/database/Guild/Guild";

interface CachedMember {
  id: Snowflake,
  username: string,
  avatar: string,
  accentColor: number,
  joinedAt: Date,
  daysInServer: number
}

interface Data {
  metadata: {
    objectId: string;
    cachedAt: number;
  };
  user: CachedMember,
}

export default class UserRoutes extends AbstractRoutes {
  public selfRegister() {
    this.getRouter().get('/users/:id', this.getMemberInformation.bind(this))
    this.getRouter().get('/servers/:id', this.getServerInformation.bind(this))
  }

  private async getServerInformation(req: Request, res: Response) {
    if (isNull(req.params.id)) {
      return this.handleError(res, ErrorType.MISSING_ARGUMENTS)
    }

    const guild = await fetchDGuild(req.params.id);
    if (isNull(guild)) {
      return this.handleError(res, ErrorType.MISSING_SIGNATURE);
    }

    return this.sendSuccessResponse(res, {
      status: true,
      data: guild
    });
  }

  private async getMemberInformation(req: Request, res: Response) {
    if (isNull(req.params.id)) {
      return this.handleError(res, ErrorType.MISSING_ARGUMENTS)
    }

    return this.sendSuccessResponse(res, {
      status: true,
      data: await this.fetchMemberFromCacheOrGuild(req.params.id)
    });
  }

  private async fetchMemberFromCacheOrGuild(member: string): Promise<Data> {
    const cached = await this.cacheManager.exists(member)
    if (cached) {
      const cachedMember = await this.cacheManager.getObject<CachedMember>(member);
      return {
        metadata: {
          objectId: cachedMember.objectId,
          cachedAt: cachedMember.cachedAt
        },
        user: cachedMember.data
      };
    }
    return {
      metadata: {
        cachedAt: null,
        objectId: null
      },
      user: await this.cacheAndFetchNewMember(member)
    };
  }

  private async cacheAndFetchNewMember(id: string): Promise<CachedMember> {
    const member = await fetchUser(id);
    const amountOfDays = getAmountOfDays(member.createdAt);
    const newMemberInfo: CachedMember = {
      id: member.id,
      username: member.displayName,
      avatar: member.avatarURL({format: 'png'}),
      accentColor: member.accentColor,
      joinedAt: member.createdAt,
      daysInServer: amountOfDays
    };

    return await this.cacheManager.addObject<CachedMember>(member.id, newMemberInfo, 3600);
  }
}

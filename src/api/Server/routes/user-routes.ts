import AbstractRoutes, {ErrorType} from "../../Server/AbstractRoutes";
import {Request, Response} from "express";
import {fetchMember, fetchUser, getAmountOfDays, isBotOrSystem, isNull} from "@fluffici.ts/types";
import {GuildMember, Snowflake, User} from "discord.js";

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
  }

  private async getMemberInformation(req: Request, res: Response) {
    if (isNull(req.params.id)) {
      return this.handleError(res, ErrorType.MISSING_SIGNATURE)
    }

    const memberId = req.params.id;
    const member = await fetchUser(memberId);

    if (isNull(member)) {
      return res.status(401).json({
        status: false,
        error: 'MISSING_MEMBER',
        message: 'This member ID does not match anything in this server.'
      });
    }

    return this.sendSuccessResponse(res, {
      status: true,
      data: await this.fetchMemberFromCacheOrGuild(member)
    });
  }

  private async fetchMemberFromCacheOrGuild(member: User): Promise<Data> {
    const cached = await this.cacheManager.exists(member.id)
    if (cached) {
      const cachedMember = await this.cacheManager.getObject<CachedMember>(member.id);
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

  private async cacheAndFetchNewMember(member: User): Promise<CachedMember> {
    const amountOfDays = getAmountOfDays(member.createdAt);
    const newMemberInfo: CachedMember = {
      id: member.id,
      username: member.displayName,
      avatar: member.avatarURL({format: 'png'}),
      accentColor: member.accentColor,
      joinedAt: member.createdAt,
      daysInServer: amountOfDays
    };

    return await this.cacheManager.addObject<CachedMember>(member.id, newMemberInfo, 190);
  }
}

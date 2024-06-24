import AbstractRoutes, {ErrorType} from "../../Server/AbstractRoutes";
import {Request, Response} from "express";
import {fetchDGuild, fetchGuild, fetchMember, fetchUser, getAmountOfDays, isNull} from "@fluffici.ts/types";
import {GuildMember, Snowflake} from "discord.js";
import verification from "@fluffici.ts/database/Guild/Verification";
import Verification from "@fluffici.ts/database/Guild/Verification";
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
    this.getRouter().get('/users/:id/is-verified', this.getMemberVerification.bind(this))
    this.getRouter().get('/servers/:id', this.getServerInformation.bind(this))
    this.getRouter().get('/servers/:id/member-monthly-count', this.getMonthlyMembers.bind(this))
    this.getRouter().get('/servers/:id/active-members', this.getActiveMembers.bind(this))
    this.getRouter().get('/servers/:id/new-members', this.getNewMembersChart.bind(this))
  }

  private async getServerInformation(req: Request, res: Response) {
    if (isNull(req.params.id)) {
      return res.json({
        status: false,
        data: {}
      })
    }

   try {
     const guild = await fetchDGuild(req.params.id);
     if (!guild) {
       return res.json({
         status: false,
         data: {}
       })
     }

     return this.sendSuccessResponse(res, guild);
   } catch (e) {
     return res.json({
       status: false,
       data: {}
     })
   }
  }

  private async getMonthlyMembers(req: Request, res: Response) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const guild = await fetchDGuild(req.params.id);

    const monthlyMembers = guild.members.cache;
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const membersJoinedInLastMonth = monthlyMembers.filter(member => member.joinedTimestamp > oneMonthAgo);

    return this.sendSuccessResponse(res, {
      count: membersJoinedInLastMonth.size
    });
  }

  private async getNewMembersChart(req: Request, res: Response) {
    try {
      const guild = await fetchDGuild(req.params.id);
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentDate = new Date();
      const lastSixMonths = [];

      for (let i = 6; i > 0; i--) {
        const d = new Date();
        d.setMonth(currentDate.getMonth() - i);
        lastSixMonths.push(monthNames[d.getMonth()]);
      }

      const monthlyMembers = guild.members.cache;
      const chartData = lastSixMonths.map(month => {
        const oneMonthAgo = currentDate.setMonth(currentDate.getMonth() - 1);
        const membersJoinedInMonth = monthlyMembers.filter(member => new Date(member.joinedTimestamp).getMonth() == month);
        return membersJoinedInMonth.size;
      });

      const newMembersChart = {
        labels: lastSixMonths,
        datasets: [
          {
            label: 'New Users',
            data: chartData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      };

      res.json(newMembersChart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "An error occured while fetching chart data." });
    }
  }

  private async getActiveMembers(req: Request, res: Response) {
    const guild = await fetchDGuild(req.params.id);
    const activeMembers = guild.members.cache.filter(member => !member.user.bot && !member.user.system);

    return this.sendSuccessResponse(res, {
      count: activeMembers.size
    });
  }

  private async getMemberVerification(req: Request, res: Response) {
    if (isNull(req.params.id)) {
      return this.sendSuccessResponse(res, {
        verified: false
      });
    }

    const member = await fetchMember('606534136806637589', req.params.id);
    if (!member) {
      return this.sendSuccessResponse(res, {
        verified: false
      });
    }

    const verification = await Verification.findOne({ memberId: req.params.id, status: 'verified' });
    if (verification || member.roles.cache.has("606542137819136020") && !member.roles.cache.has("606542004708573219")) {
      return this.sendSuccessResponse(res, {
        verified: true
      });
    }

    return this.sendSuccessResponse(res, {
      verified: false
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

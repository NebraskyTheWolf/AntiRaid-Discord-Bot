import Activity from "@fluffici.ts/database/Guild/Activity";
import { Snowflake } from "discord.js"

export default class ActivityHelper {
    private type: String
    private owner: Snowflake
    private content: String

    public setType(type: String): ActivityHelper {
        this.type = type;
        return this;
    }

    public setOwner(ownerId: Snowflake): ActivityHelper {
        this.owner = ownerId;
        return this;
    }

    public setContent(content: String): ActivityHelper {
        this.content = content;
        return this;
    }

    public async save(guildId: Snowflake): Promise<{
        status: boolean
        result?: String
    }> {
        const result = await new Activity({
            guildId: guildId,
            memberId: this.owner,
            type: this.type,
            action: this.content,
            registeredAt: Date.now()
        }).save()

      return new Promise((resolve) => {
        resolve({ status: true, result: result._id });
      })
    }
}

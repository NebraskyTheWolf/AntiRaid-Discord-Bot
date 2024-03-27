import BaseCommand from "@fluffici.ts/components/BaseCommand";
import OptionMap from "@fluffici.ts/utils/OptionMap";

import { GuildMember, Guild, CommandInteraction } from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {TextInputComponent} from "discord-modals";
import Blacklist from "@fluffici.ts/database/Common/Blacklist";

export default class CommandFindDuplicates extends BaseCommand {
    public constructor() {
        super("find", "Find all duplicates blacklist.", new OptionMap<string, boolean>()
            .add("isDeveloper", true),
            "OWNER"
        );
    }

    async handler(inter: CommandInteraction<"cached">, member: GuildMember, guild: Guild) {
      let content = []
      Blacklist.aggregate([
        {
          $group: {
            _id: { userID: { $toLower: "$userID" } },
            ids: { $addToSet: "$_id" },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]).exec().then((res) => {
        let id = 0
        res.forEach(val => {
          content.push(`${id++} - Duplicate found - ${val.userID}`)
        })
      })

      if (content.length <= 0) {
        let count = await Blacklist.countDocuments().exec();
        content.push(`No duplicates found in ${count} documents.`)
      }

      return await inter.reply({
        embeds: [
          {
            title: 'FurRaidDB - Blacklist duplicates.',
            fields: [
              {
                name: 'Object',
                value: `**Duplicates:**\n\n ${content.join('\n')}`
              }
            ],
            timestamp: Date.now()
          }
        ],
        ephemeral: false
      })
    }
}

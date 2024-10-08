import Fluffici from '@fluffici.ts'
import Blacklist from '@fluffici.ts/database/Common/Blacklist'
import BaseEvent from "@fluffici.ts/components/BaseEvent";
import Tuple from "@fluffici.ts/utils/Tuple";
import {registerAppContext} from "@fluffici.ts/utils/registerCommand";

export default class Ready extends BaseEvent {

    private readonly activities: Tuple<string> = new Tuple<string>()

    public constructor() {
        super("ready", async () => {
            this.instance.user.setActivity(`Initializing...`, { type: "LISTENING" });
            this.instance.user.setStatus("idle");

            const docCount = await Blacklist.countDocuments({}).exec();

            this.activities.add(`${Fluffici.instance.guilds.cache.size} serverů`)
            this.activities.add(`${Fluffici.instance.users.cache.size} uživatelů`)
            this.activities.add(`${docCount} raiderů`)
            this.activities.add(`v${process.env.VERSION}`)

            setInterval(() => {
                this.instance.user.setActivity({
                    type: "WATCHING",
                    url: 'https://www.twitch.tv/fluffici',
                    name: this.activities.random()
                })
            }, 5 * 1000)

            this.instance.loaded = true;
            this.instance.user.setStatus("online");
            this.instance.logger.info('The system is ready.');

            await registerAppContext()
        });
    }
}

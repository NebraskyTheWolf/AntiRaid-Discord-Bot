import BaseEvent from "@fluffici.ts/components/BaseEvent";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import Logger from "@fluffici.ts/logger";

import DisconnectEvent from "./DisconnectEvent";
import ErrorEvent from "./ErrorEvent";
import GuildAddEvent from "./GuildAddEvent";
import GuildDeleteEvent from "./GuildDeleteEvent";
import InteractionEvent from "./InteractionEvent";
import MemberJoin from "./MemberJoinEvent";
import MemberLeave from "./MemberLeaveEvent";
import MemberUpdateEvent from "./MemberUpdateEvent";
import MessageEvent from "./MessageEvent";
import Ready from "./ReadyEvent";
import ModalSubmit from "./ModalSubmitEvent";

export default class EventManager {
    private REGISTRY: OptionMap<String, BaseEvent>;
    private logger: Logger;

    public constructor() {
        this.REGISTRY = new OptionMap<String, BaseEvent>;
        this.logger = new Logger("EventRegistry");
    }

    public registerEvents(): void {
        this.registerEvent(new DisconnectEvent());
        this.registerEvent(new ErrorEvent());
        this.registerEvent(new GuildAddEvent());
        this.registerEvent(new GuildDeleteEvent())
        this.registerEvent(new InteractionEvent());
        this.registerEvent(new ModalSubmit());
        this.registerEvent(new MemberJoin());
        this.registerEvent(new MemberLeave());
        this.registerEvent(new MemberUpdateEvent())
        this.registerEvent(new MessageEvent());
        this.registerEvent(new Ready());
    }

    private registerEvent(base: BaseEvent): void {
        this.REGISTRY.add(base.name, base);
        this.logger.info(`Event ${base.name} is now registered.`);
    }

    public getEvent(key: String): BaseEvent {
        return this.REGISTRY.get(key);
    }
}

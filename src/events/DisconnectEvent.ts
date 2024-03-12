import BaseEvent from "@fluffici.ts/components/BaseEvent";

export default class DisconnectEvent extends BaseEvent {
    public constructor() {
        super("disconnect", () => { });
    }
}

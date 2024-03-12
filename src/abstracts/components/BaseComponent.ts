import { Interaction } from "discord.js";
import Base from "../Base";

export default abstract class BaseComponent<T extends Interaction<"cached">, V> extends Base {

    protected constructor(customId: string) {
        super(customId, "", "COMPONENT");
    }

    public abstract handler(inter: T): V;
}

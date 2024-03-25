import Base from "../Base";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import { Interaction, MessageEmbed } from "discord.js";

export default abstract class BaseButton<T, V> extends Base {
    public readonly customId: string;
    public readonly setting: OptionMap<string, unknown> = new OptionMap<string, unknown>();
    public readonly arguments: OptionMap<string, string>;

    protected constructor(name: string, label: string) {
        super(name, label, "BUTTON");
        this.customId = this.name;
        this.arguments = new OptionMap<string, string>();
    }

    public abstract handler(interaction: Interaction<"cached">): Promise<V>;
    public abstract message(): MessageEmbed;
    public abstract generate(): T;

    protected getComponent(customId: string): T {
        return this.instance.buttonManager.getButton(customId).generate() as T;
    }

    protected getArguments():  OptionMap<string, string> {
      return this.arguments
    }
}

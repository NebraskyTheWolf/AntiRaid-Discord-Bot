import OptionMap from "@fluffici.ts/utils/OptionMap";
import Logger from "@fluffici.ts/logger";
import BaseButton from "@fluffici.ts/components/BaseButton";
import BaseComponent from "@fluffici.ts/components/BaseComponent";
import { Snowflake, Collection, MessageButton, Interaction } from "discord.js";
import Fragment from "./Fragment";
import FragmentAction from "./FragmentAction";
import ConfirmButton from "./admin/ConfirmButton";
import ConfirmBulkBlacklist from "./admin/bulk/ConfirmBulkBlacklist";
import CancelButton from "./admin/bulk/CancelButton";
import SyncButton from "./admin/SyncButton";
import ButtonVerify from "./verification/ButtonVerify";
import SelectUpdate from "./verification/SelectUpdate";
import SupportTicket from "./support/SupportTicket";

export default class ButtonManager {
    private BUTTONS: OptionMap<String, BaseButton<unknown, unknown>>;
    private component: OptionMap<String, BaseComponent<Interaction<"cached">, unknown>>
    private DYNAMIC_BUTTON: OptionMap<Snowflake, OptionMap<String, BaseButton<unknown, unknown>>>;
    private logger: Logger;

    public constructor() {
        this.BUTTONS = new OptionMap<String, BaseButton<unknown, unknown>>();
        this.component = new OptionMap<String, BaseComponent<Interaction<"cached">, unknown>>();
        this.DYNAMIC_BUTTON = new OptionMap<Snowflake, OptionMap<String, BaseButton<unknown, unknown>>>();
        this.logger = new Logger("ButtonRegistry");
    }

    public registerButtons(): void {
      this.addButton(new ConfirmButton())

      // Bulk blacklist on lockdown.
      this.addButton(new ConfirmBulkBlacklist())
      this.addButton(new CancelButton())

      // Dev button
      this.addButton(new ButtonVerify())
      this.addButton(new SelectUpdate())


      // Support ticket
      this.addButton(new SupportTicket())
    }

    public addButton(button: BaseButton<unknown, unknown>): void {
        button.setting.add("isDynamic", false);
        this.BUTTONS.add(button.customId, button);
        this.logger.info(`Component ${button.customId} registered.`);
    }

    public addComponent(handle: BaseComponent<Interaction<"cached">, unknown>): void {
        this.component.add(handle.name, handle);
    }

    public getComponent(customId: string): BaseComponent<Interaction<"cached">, unknown> {
        return this.component.get(customId);
    }

    public addDynamicButton(userId: Snowflake, button: BaseButton<unknown, unknown>): void {
        button.setting.add("ownerId", userId);
        button.setting.add("timeout", 300);
        button.setting.add("isDynamic", true);

        const fX: OptionMap<String, BaseButton<unknown, unknown>> =
            new OptionMap<String, BaseButton<unknown, unknown>>()
                .add(button.name, button);
        this.DYNAMIC_BUTTON.add(userId, fX);
        this.logger.info(`Dynamic button added for ${userId}@${button.customId} expire at ${new Date((button.setting.get("timeout") as number))}.`);
    }

    public getButton(customId: String): BaseButton<unknown, unknown> {
        const button: BaseButton<unknown, unknown> = this.BUTTONS.get(customId);
        if (button.setting !== undefined && button.setting.get("isRestricted"))
            throw new Error("You can't call " + button.customId + " because it's restricted.");
        return button;
    }

    public getDynamicButton(userId: Snowflake, customId: String): BaseButton<unknown, unknown> {
        return this.DYNAMIC_BUTTON.get(userId).get(customId);
    }

    public createLinkButton(label: string, link: string): MessageButton {
        return new Fragment(label, link).generate();
    }

    public createButton(label: string, custom_id: string): MessageButton {
        return new FragmentAction(label, custom_id).generate();
    }

    public executeOnly(customId: string, inter: Interaction<"cached">): void {
        this.BUTTONS.get(customId).handler(inter);
    }

    public reload() {
        this.BUTTONS.getMap().clear();
        this.logger.warn("Button registry cleared.");
        this.registerButtons();
        this.logger.info("Button registry reloaded.");
    }

    public toMap(): Collection<String, BaseButton<unknown, unknown>> {
        return this.BUTTONS.getMap()
    }
}

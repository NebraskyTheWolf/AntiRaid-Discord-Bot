import Base from "../Base";
import { ModalSubmitInteraction } from "discord-modals";

export default abstract class BaseModal extends Base {
    protected constructor(name: string, description?: string) {
        super(name, description, "MODAL");
    }

    public abstract handler(interaction: ModalSubmitInteraction): void;
}

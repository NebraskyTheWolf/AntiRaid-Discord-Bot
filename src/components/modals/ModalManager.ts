import BaseModal from "@fluffici.ts/components/BaseModal";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import ModalBlacklistAdd from "./admin/ModalBlacklistAdd";
import ModalEval from "./dev/ModalEval";
import ModalVerificationDenied from "./verify/ModalVerificationDenied";
import ModalVerificationSubmit from "./verify/ModalVerificationSubmit";

export default class ModalManager {
    private MODALS: OptionMap<string, BaseModal>;

    public constructor() {
        this.MODALS = new OptionMap<string, BaseModal>();
    }

    public registerModals(): void {
      this.registerModal(new ModalBlacklistAdd())
      this.registerModal(new ModalEval())

      this.registerModal(new ModalVerificationDenied())
      this.registerModal(new ModalVerificationSubmit())
    }

    public registerModal(modal: BaseModal): void {
        if (this.MODALS.get(modal.name)) {
            throw new Error("You can't register the same 'BaseModal' at once");
        }
        this.MODALS.add(modal.name, modal);
    }

    public getModal(customId: string): BaseModal {
        return this.MODALS.get(customId);
    }

    public reload(): void {
        this.MODALS.getMap().clear();
        this.registerModals();
    }
}

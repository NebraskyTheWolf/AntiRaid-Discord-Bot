import BaseEvent from "@fluffici.ts/components/BaseEvent";
import * as process from 'process'

export default class ErrorEvent extends BaseEvent {

  private errorCount: number = 0;

    public constructor() {
        super("error", () => {
          this.errorCount++;
          if (this.errorCount >= this.getDefaultConfig().get("max-errors")) {
            this.instance.logger.warn("Error count reached, restarting...")
            process.exit(105)
          }
        });
    }
}

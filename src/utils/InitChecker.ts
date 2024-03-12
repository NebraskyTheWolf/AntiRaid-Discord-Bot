import Riniya from "@fluffici.ts";
import { isNull } from "@fluffici.ts/types";

export default class InitChecker {
  public init (): Boolean {
    if (this.unset("TOKEN"))
      return this.print("TOKEN")
    else if (this.unset("MONGODB"))
      return this.print("MONGODB")
    return false
  }

  private unset (key: string): Boolean {
    return isNull(process.env[key])
  }

  public read<T> (key: string): T {
    if (this.unset(key))
      this.print(key)
    return process.env[key] as T
  }

  private print (type: string): Boolean {
    Riniya.instance.logger.error("-------------------------------------------")
    Riniya.instance.logger.error(" -> InitChecker failed at '" + type + "'.  ")
    Riniya.instance.logger.error("   -> Please check your environement file. ")
    Riniya.instance.logger.error("   -> Restart is required to continue.     ")
    Riniya.instance.logger.error("-------------------------------------------")
    return true;
  }
}

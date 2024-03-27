import BaseTask from "@fluffici.ts/components/BaseTask";
import {fetchMember, updateVerification} from "@fluffici.ts/types";
import Verification from "@fluffici.ts/database/Guild/Verification";

export default class SyncVerification extends BaseTask {
  public constructor() {
    super("SyncVerification", "Updating buttons when members are leaving.", 60,
      async () => {
        const verifications = await Verification.find({
          status: 'pending'
        })
        verifications.forEach(async verification => {
          const member = await fetchMember(verification.guildId, verification.memberId);
          if (!member) {
            await updateVerification(member, "The user left before getting verified.");
          }
        })
      })
  }
}

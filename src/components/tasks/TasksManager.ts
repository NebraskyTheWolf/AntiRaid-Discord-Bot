import Fluffici from "@fluffici.ts";
import BaseTask from "@fluffici.ts/components/BaseTask";
import OptionMap from "@fluffici.ts/utils/OptionMap";
import SyncRemote from "./sync/SyncRemote";

export default class TasksManager {
    private TASKS: OptionMap<string, BaseTask>

    public constructor() {
        this.TASKS = new OptionMap<string, BaseTask>()
    }

    public registerAll(): void {
      this.register(new SyncRemote())
    }

    private register(task: BaseTask): void {
      Fluffici.instance.logger.info(`TASK : ${task.name}@${task.description} : (${task.type}) Registered.`)
      this.TASKS.add(task.name, task)
    }
}

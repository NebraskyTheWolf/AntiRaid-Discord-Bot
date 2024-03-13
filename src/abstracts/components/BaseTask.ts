import Base from "../Base";

export default abstract class BaseTask extends Base {

    private readonly taskId: number;

    protected constructor(name: string, label: string, time: number, listener: Function) {
        super(name, label, "TASK");

        this.taskId = setInterval(listener, time * 1000)
        this.instance.logger.info(`Running ${name} on taskId ${this.taskId}`)
    }

    protected getTaskId(): number {
      return this.taskId
    }
}

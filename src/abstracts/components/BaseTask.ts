import Base from "../Base";

export default abstract class BaseTask extends Base {
    protected constructor(name: string, label: string, time: number, listener: Function) {
        super(name, label, "TASK");

        setInterval(listener, time * 1000)
    }
}

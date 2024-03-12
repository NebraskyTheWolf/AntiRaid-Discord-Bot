import Base from "../Base";

export default abstract class BaseEvent extends Base {
    protected constructor(name: string, listener: Function) {
        super(name, "", "EVENT");

        this.instance.on(this.name, listener.bind(this.instance));
    }
}

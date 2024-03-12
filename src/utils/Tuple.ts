import { Collection } from "discord.js";
import OptionMap from "./OptionMap";

export default class Tuple<T> {
    private readonly data: OptionMap<number, T>;
    private index: number = 0

    public constructor() {
        this.data = new OptionMap<number, T>();
    }

    public add(type: T): void {
        this.data.add(this.index++, type);
    }

    public random(): T {
        return this.data.get(Math.floor(Math.random() * this.getAll().size))
    }

    public clear(): void {
        this.data.getMap().clear();
    }

    public getAll(): Collection<number, T> {
        return this.data.getMap();
    }
}

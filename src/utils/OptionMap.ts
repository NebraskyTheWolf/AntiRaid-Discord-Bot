import { Collection } from "discord.js";

export default class OptionMap<T, V> {
    private readonly map: Collection<T, V>;

    public constructor() {
        this.map = new Collection();
    }

    public add(key: T, value: V): OptionMap<T, V> {
        this.map.set(key, value);
        return this;
    }

    public get(key: T, _default: any = null): V {
        return this.map.get(key) || _default;
    }

    public has(key: T): boolean {
      return this.map.has(key)
    }

    public remove(key: T): Boolean {
        return this.map.delete(key);
    }

    public size(): number {
        return this.map.size;
    }

    public getMap(): Collection<T, V> {
        return this.map;
    }
}

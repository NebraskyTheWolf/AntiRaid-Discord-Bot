import { getInstance } from "@fluffici.ts/types";
import { v4 } from "uuid";

export declare type RedisKey = string;
export declare type ExpireIn = number;

export declare interface CacheItem<T> {
    objectId: string;
    cachedAt: number;
    data: T;
}

export default class CacheManager {

    private readonly prefix: string;

    public constructor(prefix: string) {
        this.prefix = prefix;
    }

    public async addObject<T>(key: RedisKey, object: T, expiry: ExpireIn): Promise<T> {
        const buildKey: string = this.prefix + "@" + key;

        await getInstance().redisClient.set(buildKey, JSON.stringify({
            objectId: v4(),
            cachedAt: Date.now(),
            data: object
        }))
        await getInstance().redisClient.expire(buildKey, expiry)
        const result = await getInstance().redisClient.exists(buildKey)

        return new Promise<T>((resolve, reject) => {
            if (result) {
                resolve(object)
            } else {
                reject("Unable to cache " + key + ".")
            }
        })
    }

    public async getObject<T>(key: RedisKey): Promise<CacheItem<T>> {
        const buildKey: string = this.prefix + "@" + key;

        const exists = await getInstance().redisClient.exists(buildKey)
        const result: CacheItem<T> = JSON.parse(
            await getInstance().redisClient.get(buildKey)
        )

        return new Promise<CacheItem<T>>((resolve, reject) => {
            if (exists) {
                resolve(result)
            } else {
                reject("Unable to get " + buildKey + ".")
            }
        })
    }

    public async removeObject(key: RedisKey): Promise<Boolean> {
        const buildKey: string = this.prefix + "@" + key;

        const deleted = await getInstance().redisClient.del(buildKey)
        return new Promise<Boolean>((resolve) => {
            resolve((deleted === 1))
        })
    }

    public async exists(key: RedisKey): Promise<Boolean> {
        const buildKey: string = this.prefix + "@" + key;

        const exists = await getInstance().redisClient.exists(buildKey)
        return new Promise<Boolean>((resolve) => {
            resolve((exists === 1))
        })
    }
}

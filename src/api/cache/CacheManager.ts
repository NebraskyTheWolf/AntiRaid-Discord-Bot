import { getInstance } from "@fluffici.ts/types";
import { v4 } from "uuid";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export declare type RedisKey = string;
export declare type ExpireIn = number;

/**
 * Represents a item stored in a cache.
 *
 * @template T - The type of data stored in the cache item.
 */
export declare interface CacheItem<T> {
    objectId: string;
    cachedAt: number;
    data: T;
}

/**
 * Class representing a CacheManager.
 */
export default class CacheManager {
    private readonly cache: OptionMap<string, string> = new OptionMap<string, string>()

    /**
     * Adds an object to the cache with the specified key and expiry time.
     *
     * @template T - The type of the object being added to the cache.
     * @param {RedisKey} key - The key for the object in the cache.
     * @param {T} object - The object to add to the cache.
     * @param {ExpireIn} expiry - The expiry time for the object in the cache.
     * @returns {Promise<T>} - A promise that resolves with the added object if successfully added to the cache,
     *                        or rejects with an error message if unable to cache the object.
     */
    public async addObject<T>(key: RedisKey, object: T, expiry: ExpireIn): Promise<T> {
      const struct = JSON.stringify({
        objectId: v4(),
        cachedAt: Date.now(),
        data: object
      });

      this.cache.add(key, struct)

      return new Promise<T>((resolve, reject) => {
        if (this.cache.has(key)) {
          resolve(object)
        } else {
          reject("Unable to cache " + key + ".")
        }
      })
    }

    /**
     * Retrieves an object from the cache using the provided key.
     *
     * @template T - The type of the object to retrieve.
     *
     * @param {RedisKey} key - The key associated with the object in the cache.
     *
     * @return {Promise<CacheItem<T>>} - A promise that resolves to the retrieved object if it exists in the cache.
     *                                  Otherwise, the promise is rejected with an error message.
     */
    public async getObject<T>(key: RedisKey): Promise<CacheItem<T>> {
        const exists = this.cache.has(key)
        const result: CacheItem<T> = JSON.parse(this.cache.get(key))
        return new Promise<CacheItem<T>>((resolve, reject) => {
            if (exists) {
                resolve(result)
            } else {
                reject("Unable to get " + key + ".")
            }
        })
    }

    /**
     * Removes an object from the cache.
     *
     * @param {RedisKey} key - The key of the object to be removed.
     * @return {Promise<Boolean>} A promise that resolves to a boolean indicating whether the object was successfully removed.
     */
    public async removeObject(key: RedisKey): Promise<Boolean> {
        return new Promise<Boolean>((resolve) => {
            resolve(this.cache.remove(key))
        })
    }

    /**
     * Determines whether a given key exists in the Redis cache.
     *
     * @param {RedisKey} key - The key to be checked in the Redis cache.
     * @return {Promise<Boolean>} - A promise that resolves to a boolean indicating if the key exists in the cache.
     */
    public async exists(key: RedisKey): Promise<Boolean> {
       return new Promise<Boolean>((resolve) => {
            resolve(this.cache.has(key))
        })
    }
}

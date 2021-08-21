import conf from 'conf';
import { Config, Feed } from 'graba.interface';

const CONFIG_NAME = 'appConfig';
const DEFAULTS = {
    feeds: [],
};

const store = new conf<Config>({
    configName: CONFIG_NAME,
    defaults: DEFAULTS,
});

const configHelpers = {
    toObject: (): Config => {
        return { ...store.store };
    },
    createOrUpdateFeed: (feed: Feed): void => {
        const feeds = store.get('feeds').slice();
        const i = feeds.findIndex(f => f.id === feed.id);
        if (i !== -1) {
            feeds[i] = feed;
        } else {
            feeds.push(feed);
        }
        store.set('feeds', feeds);
    },
    deleteFeed: (id: string): void => {
        const feeds = store.get('feeds').slice();
        const i = feeds.findIndex(f => f.id === id);
        if (i !== -1) {
            feeds.splice(i, 1);
            store.set('feeds', feeds);
        }
    },
    update(updates: Partial<Config>) {
        // remove feeds
        delete updates['feeds'];

        Object.keys(updates).forEach(k => {
            const key = k as keyof Config;
            store.set(key, updates[key]);
        });
    }
}

export type ConfigType = Config & typeof configHelpers;

/**
 * Configuration backed by JSON store.
 * 
 * Proxy enables us to have generic getters and setters that we can
 * redirect to the conf `get` and `set` methods.
 */
export const config = new Proxy(configHelpers, { 
    get: (target, key) => {
        return target.hasOwnProperty(key)
            ? target[key as keyof typeof configHelpers]
            : store.get(key as keyof Config);
    },
    set: (target, key, value) => {
        store.set(key as keyof Config, value);
        return true;
    },
}) as ConfigType;
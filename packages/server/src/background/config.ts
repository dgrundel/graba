import conf from 'conf';
import { Config, Feed } from 'hastycam.interface';

const CONFIG_NAME = 'appConfig';
const DEFAULTS = {
    feeds: [],
};

class ConfigImpl implements Config {
    private readonly store: conf<Config>;

    constructor() {
        this.store = new conf<Config>({
            configName: CONFIG_NAME,
            defaults: DEFAULTS,
        });
    }

    toObject(): Config {
        return {
            ...this.store.store
        };
    }

    set feeds(value: Feed[]) {
        this.store.set('feeds', value);
    }

    get feeds() {
        return this.store.get('feeds');
    }

    createOrUpdateFeed(feed: Feed) {
        const feeds = this.feeds.slice();
        const i = feeds.findIndex(f => f.id === feed.id);
        if (i !== -1) {
            feeds[i] = feed;
            this.feeds = feeds;
        } else {
            this.feeds = this.feeds.concat(feed);
        }
    }

    deleteFeed(id: string) {
        const feeds = this.feeds.slice();
        const i = feeds.findIndex(f => f.id === id);
        if (i !== -1) {
            feeds.splice(i, 1);
            this.feeds = feeds;
        }
    }
}

export const config = new ConfigImpl();
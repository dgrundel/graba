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
}

export const config = new ConfigImpl();
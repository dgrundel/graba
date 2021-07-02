import conf from 'conf';

interface Feed {
    name: string;
    streamUrl: string;
}

interface Config {
    feeds: Feed[];
}

const store = new conf<Config>({
    configName: 'appConfig',
    defaults: {
        feeds: [],
    }
});

const get = <K extends keyof Config> (key: K): Config[K] => {
    return store.get(key);
};

const set = <K extends keyof Config> (key: K, value: Config[K]): void => {
    store.set(key, value);
}

const remove = (key: keyof Config): void => {
    store.delete(key);
}

export const config = {
    get,
    set,
    remove,
};
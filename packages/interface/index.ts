export interface Feed {
    name: string;
    streamUrl: string;
}

export interface Config {
    feeds: Feed[];
}
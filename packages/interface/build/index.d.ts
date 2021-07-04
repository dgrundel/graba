export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
}
export interface Config {
    feeds: Feed[];
}

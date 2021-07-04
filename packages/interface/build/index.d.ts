export interface ErrorMessage {
    field: string;
    message: string;
}
export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    stillUrl?: string;
}
export declare const validateFeed: (feed: Partial<Feed>) => ErrorMessage[];
export interface Config {
    feeds: Feed[];
}

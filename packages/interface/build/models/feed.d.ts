import { ErrorMessage } from '../validator/validators';
export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    maxFps?: number;
    scaleFactor?: number;
}
export declare const validateFeed: (feed: Partial<Feed>) => ErrorMessage[];
export interface Config {
    feeds: Feed[];
}

import { ErrorMessage } from '../validator/validators';
export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    maxFps?: number;
    scaleFactor?: number;
    videoQuality?: number;
    detectMotion?: boolean;
}
export declare namespace Feed {
    const DEFAULT_VIDEO_QUALITY = 24;
    const DEFAULT_MAX_FPS = 16;
}
export declare const validateFeed: (feed: Partial<Feed>) => ErrorMessage[];
export interface Config {
    feeds: Feed[];
}

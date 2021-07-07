import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';

export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    maxFps?: number;
    scaleFactor?: number;
    videoQuality?: number; // range 2-31, 31 is worst
}

export namespace Feed {
    export const DEFAULT_VIDEO_QUALITY = 24;
    export const DEFAULT_MAX_FPS = 16;
}

export const validateFeed = (feed: Partial<Feed>): ErrorMessage[] => {
    return mergeErrors(
        validateNotEmpty(feed, 'id'),
        validateNotEmpty(feed, 'name', 'Feed name'),
        validateNotEmpty(feed, 'streamUrl', 'Stream URL'),
        validateNumeric(feed, 'maxFps', 'Max FPS'),
        validateNumeric(feed, 'scaleFactor', 'Scale factor'),
        ...validateIf(
            validateNumeric(feed, 'videoQuality', 'Video quality'),
            validateNumberGreaterThanOrEqual(feed, 'videoQuality', 2, 'Video quality'),
            validateNumberLessThanOrEqual(feed, 'videoQuality', 31, 'Video quality'),
        ),
    );
}

export interface Config {
    feeds: Feed[];
}
import { ErrorMessage, mergeErrors, validateNotEmpty, validateNumeric } from '../validator/validators';

export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    maxFps?: number;
    scaleFactor?: number;
}

export const validateFeed = (feed: Partial<Feed>): ErrorMessage[] => {
    return mergeErrors(
        validateNotEmpty(feed, 'id'),
        validateNotEmpty(feed, 'name', 'Feed name'),
        validateNotEmpty(feed, 'streamUrl', 'Stream URL'),
        validateNumeric(feed, 'maxFps', 'Max FPS'),
        validateNumeric(feed, 'scaleFactor', 'Scale factor'),
    );
}

export interface Config {
    feeds: Feed[];
}
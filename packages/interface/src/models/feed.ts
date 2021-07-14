import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';

export interface MotionDetectionSettings {
    diffThreshold?: number;
}

export interface Feed {
    id: string;
    name: string;

    // stream processing (ffmpeg)
    streamUrl: string;
    maxFps?: number;
    scaleFactor?: number; // multiplied by width and height of video to resize
    videoQuality?: number; // range 2-31, 31 is worst

    // storage
    saveVideo?: boolean;
    savePath?: string;

    // motion detection
    detectMotion?: boolean;
    motionDetectionSettings?: MotionDetectionSettings;
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
            [
                validateNumberGreaterThanOrEqual(feed, 'videoQuality', 2, 'Video quality'),
                validateNumberLessThanOrEqual(feed, 'videoQuality', 31, 'Video quality'),
            ]
        ),
        ...validateIf(
            feed.saveVideo === true,
            [
                validateNotEmpty(feed, 'savePath', 'Storage path'),
            ]
        ),
        ...validateIf(
            feed.detectMotion === true,
            validateIf(
                validateNotEmpty(feed, 'motionDetectionSettings', 'Motion detection settings'),
                [
                    validateNumeric(feed.motionDetectionSettings!, 'diffThreshold', 'Threshold'),
                    validateNumberLessThanOrEqual(feed.motionDetectionSettings!, 'diffThreshold', 1, 'Threshold'),
                    validateNumberGreaterThanOrEqual(feed.motionDetectionSettings!, 'diffThreshold', 0, 'Threshold'),
                ]
            )
        ),
    );
}

export interface Config {
    feeds: Feed[];
}
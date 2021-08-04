import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';
import { MotionRegion } from './geometry';

export interface Feed {
    id: string;
    name: string;

    // stream processing (ffmpeg)
    streamUrl: string;
    maxFps: number;
    scaleFactor: number; // multiplied by width and height of video to resize
    videoQuality: number; // range 2-31, 31 is worst

    // storage
    saveVideo?: boolean;
    savePath?: string;
    onlySaveMotion?: boolean; // only save video when motion is detected
    motionEndTimeout?: number; // seconds. how long to wait for more motion after motion has stopped before ending recording

    // motion detection
    detectMotion?: boolean;
    motionSampleInterval?: number;
    motionDiffThreshold?: number;
    motionRegions?: MotionRegion[];
}

export namespace Feed {
    export const DEFAULT_VIDEO_QUALITY = 24;
    export const DEFAULT_MAX_FPS = 16;
    export const DEFAULT_MOTION_SAMPLE_INTERVAL = 2;
    export const DEFAULT_MOTION_DIFF_THRESHOLD = .03;
    export const MIN_MOTION_END_TIMEOUT = 1; // 1 sec
}

export const validateFeed = (feed: Partial<Feed>): ErrorMessage[] => {
    return mergeErrors(
        validateNotEmpty(feed, 'id'),
        validateNotEmpty(feed, 'name', 'Feed name'),
        validateNotEmpty(feed, 'streamUrl', 'Stream URL'),
        validateNumeric(feed, 'maxFps', 'Max FPS'),
        validateNumeric(feed, 'scaleFactor', 'Scale factor'),
        ...validateIf(
            validateNotEmpty(feed, 'videoQuality', 'Video quality'),
            [
                validateNumeric(feed, 'videoQuality', 'Video quality'),
                validateNumberGreaterThanOrEqual(feed, 'videoQuality', 2, 'Video quality'),
                validateNumberLessThanOrEqual(feed, 'videoQuality', 31, 'Video quality'),
            ]
        ),
        ...validateIf(
            feed.saveVideo === true,
            [
                validateNotEmpty(feed, 'savePath', 'Storage path'),
                ...validateIf(
                    typeof feed.motionEndTimeout !== 'undefined',
                    [
                        validateNumeric(feed, 'motionEndTimeout', 'Motion timeout'),
                        validateNumberGreaterThanOrEqual(feed, 'motionEndTimeout', Feed.MIN_MOTION_END_TIMEOUT, 'Motion timeout'),
                    ]
                ),
            ]
        ),
        ...validateIf(
            feed.detectMotion === true,
            [
                ...validateIf(
                    typeof feed.motionSampleInterval !== 'undefined',
                    [
                        validateNumeric(feed, 'motionSampleInterval', 'Motion sampling interval'),
                        validateNumberGreaterThanOrEqual(feed, 'motionSampleInterval', 1, 'Motion sampling interval'),
                    ]
                ),
                ...validateIf(
                    typeof feed.motionDiffThreshold !== 'undefined',
                    [
                        validateNumeric(feed, 'motionDiffThreshold', 'Motion detection threshold'),
                        validateNumberLessThanOrEqual(feed, 'motionDiffThreshold', 1, 'Motion detection threshold'),
                        validateNumberGreaterThanOrEqual(feed, 'motionDiffThreshold', 0, 'Motion detection threshold'),
                    ]
                ),
            ]
        ),
    );
}

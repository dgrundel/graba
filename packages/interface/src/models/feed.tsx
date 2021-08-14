import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';
import { MotionRegion } from './geometry';
import React from 'react';

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

    // alerts
    alertOnMotion?: boolean;
}

export namespace Feed {
    export const ID_LENGTH = 12;
    export const DEFAULT_VIDEO_QUALITY = 24;
    export const DEFAULT_MAX_FPS = 16;
    export const DEFAULT_MOTION_SAMPLE_INTERVAL = 2;
    export const DEFAULT_MOTION_DIFF_THRESHOLD = .03;
    export const MIN_MOTION_END_TIMEOUT = 1; // 1 sec

    export const FIELD_NAMES: Record<keyof Feed, string> = {
        id: 'id',
        name: 'Name',
        streamUrl: 'Stream URL',
        maxFps: 'Max FPS',
        scaleFactor: 'Scale factor',
        videoQuality: 'Video quality',
        saveVideo: 'Save video',
        savePath: 'Save path',
        onlySaveMotion: 'Only save when motion detected',
        motionEndTimeout: 'Motion timeout',
        detectMotion: 'Motion detection',
        motionSampleInterval: 'Motion sampling interval',
        motionDiffThreshold: 'Motion diff threshold',
        motionRegions: 'Motion regions',
        alertOnMotion: 'Alert when motion detected',
    };
    
    export const FIELD_TOOLTIPS: Record<keyof Feed, string | JSX.Element | undefined> = {
        id: undefined,
        name: undefined,
        streamUrl: undefined,
        maxFps: <>
            Set an upper bound for video frame rate.
            Lower values improve performance of background video processing and viewing in browser.
        </>,
        scaleFactor: <>
            Scale the width and height of the video.
            Lower values improve performance of background video processing and viewing in browser.
        </>,
        videoQuality: <>
            Quality level of the video output. 
            Range is 2-31 where a lower number represents better quality.
            <em>This value is passed to FFmpeg's <code>qscale</code> argument.</em>
        </>,
        saveVideo: undefined,
        savePath: undefined,
        onlySaveMotion: <>
            Requires motion detection enabled.
        </>,
        motionEndTimeout: <>
            When only saving video on motion detection, this is the <em>minimum</em> amount of 
            time to wait for more motion to happen before recording is stopped.
        </>,
        detectMotion: undefined,
        motionSampleInterval: <>
            Check every <em>n</em> pixels for motion.
            When set to a value greater than <strong>1</strong>, video frame pixel data will
            be sampled during motion detection. Larger values improve performance by lowering
            the number of pixels checked for motion but also reduce the effectiveness of Motion
            detection.
        </>,
        motionDiffThreshold: <>
            Percentage of pixels in a frame that must be different to be considered "motion".
            Lower values increase sensitivity of motion detection.
        </>,
        motionRegions: <>
            <strong>Optional.</strong> Click and drag to define motion detection regions in image.
            If no regions are set, motion detection will be performed on the entire video frame.
            Setting regions can also improve performance by limiting the amount of pixels on which motion 
            detection is performed.
        </>,
        alertOnMotion: undefined,
    };
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

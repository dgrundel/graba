import { Feed } from 'graba.interface';
import sharp from 'sharp';
import { frameDiff } from './functional/frameDiff';
import { Frame } from './FFmpegToJpeg';
import { LimitCounter } from './LimitCounter';
import { logger } from './functional/logger';

const DEFAULT_SAMPLE_INTERVAL = 1;

export class MotionDetector {
    private readonly feed: Feed;
    private prevPixels?: Buffer;
    
    private motionlessFrameCount: LimitCounter;
    private inMotionEvent: boolean = false;


    constructor(feed: Feed) {
        this.feed = feed;

        // frame counter for motion stop/start
        const motionEndAfterFrameCount = feed.maxFps * (feed.motionEndTimeout || Feed.MIN_MOTION_END_TIMEOUT);
        this.motionlessFrameCount = new LimitCounter(motionEndAfterFrameCount);
    }

    async processFrame(frame: Frame): Promise<Frame> {
        const withMotionMarker = await this.detectMotion(frame);
        const withStartEnd = this.markMotionStartEnd(withMotionMarker);

        return withStartEnd;
    }

    async detectMotion(frame: Frame): Promise<Frame> {
        const jpg = frame.buffer;
        const feed = this.feed;
        const enabled = feed.detectMotion === true;
        
        if (!enabled) {
            return frame;
        }

        const sampleInterval = feed.motionSampleInterval || DEFAULT_SAMPLE_INTERVAL;
        const diffThreshold = feed.motionDiffThreshold || 0;
        const motionRegions = feed.motionRegions;

        const raw = await sharp(jpg)
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        const { width, height } = raw.info;
        const pixels = raw.data;
    
        const prevPixels = this.prevPixels;
        this.prevPixels = pixels; // set prev for next iteration

        if (prevPixels) {
            const diff = frameDiff(prevPixels, pixels, width, height, {
                colorThreshold: 0.1,
                sampleInterval: sampleInterval,
                regions: motionRegions || [],
            });

            const diffPercent = diff.pxDiffCount / diff.pxAnalyzeCount;
            if (diffPercent >= diffThreshold) {
                const diffBuffer = await sharp(diff.pixelData, {
                    raw: {
                        width,
                        height,
                        channels: 3,
                    }
                })
                    .jpeg()
                    .toBuffer();
                return {
                    buffer: diffBuffer,
                    motionDetected: true,
                };
            }
        }

        // no diff, just return original data
        return frame;
    }

    markMotionStartEnd(frame: Frame): Frame {
        const motionDetected = frame.motionDetected === true;
        if (motionDetected) {
            this.motionlessFrameCount.reset()
        } else {
            this.motionlessFrameCount.increment();
        }

        const isMotionStart = this.inMotionEvent === false && motionDetected;
        const isMotionEnd = this.inMotionEvent === true && this.motionlessFrameCount.hasReachedLimit();

        if (isMotionStart) {
            this.inMotionEvent = true;
        } else if (isMotionEnd) {
            this.inMotionEvent = false;
        }

        if (motionDetected || isMotionStart || isMotionEnd) {
            logger.debug({
                motionDetected,
                isMotionStart,
                isMotionEnd,
            });
        }

        return {
            ...frame,
            isMotionStart,
            isMotionEnd,
        };
    }
}
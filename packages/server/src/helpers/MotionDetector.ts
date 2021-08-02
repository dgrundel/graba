import { Feed, MotionRegion } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import sharp from 'sharp';
import { frameDiff } from './frameDiff';
import { Frame } from './FFmpegToJpeg';

const DEFAULT_SAMPLE_INTERVAL = 1;

export class MotionDetector {
    private readonly feed: Feed;
    private prevPixels?: Buffer;

    constructor(feed: Feed) {
        this.feed = feed;
    }

    async processFrame(frame: Frame): Promise<Frame> {
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
}
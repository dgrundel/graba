import { Feed, MotionRegion } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import sharp from 'sharp';
import { frameDiff } from './frameDiff';
import { Frame } from './FFmpegToJpeg';

const DEFAULT_SAMPLE_INTERVAL = 1;

export class MotionDetector extends FeedConsumer {
    private prevPixels?: Buffer;

    handleFeedUpdate(feed: Feed, prev: Feed): void {
        // if video scale changes, frame sizes won't match, so we need to clear prev frame
        this.prevPixels = undefined;
    }

    handleFeedEnd(feed: Feed): void {
        // clean up here
        this.prevPixels = undefined;
    }
    
    async processFrame(frame: Frame): Promise<Frame> {
        const jpg = frame.buffer;
        const feed = this.getFeed();
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

            const maxDiffPixels = Math.floor(width * height / sampleInterval);
            const diffPercent = diff.count / maxDiffPixels;

            if (diffPercent >= diffThreshold) {
                const diffBuffer = await sharp(diff.pixels, {
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
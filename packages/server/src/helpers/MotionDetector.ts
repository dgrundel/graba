import { Feed, MotionRegion } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import sharp from 'sharp';
import { frameDiff } from './frameDiff';

const SAMPLE_INTERVAL = 1;

export class MotionDetector extends FeedConsumer {
    private prevPixels?: Buffer;
    private enabled: boolean;
    private diffThreshold: number;
    private motionRegions?: MotionRegion[];

    constructor(feed: Feed) {
        super(feed);

        this.enabled = feed.detectMotion === true;
        this.diffThreshold = feed.motionDiffThreshold || 0;
        this.motionRegions = feed.motionRegions;
    }

    handleFeedUpdate(feed: Feed, prev: Feed): void {
        // update settings from feed
        this.enabled = feed.detectMotion === true;
        this.diffThreshold = feed.motionDiffThreshold || 0;
        this.motionRegions = feed.motionRegions;

        // if video scale changes, frame sizes won't match, so we need to clear prev frame
        this.prevPixels = undefined;
    }

    handleFeedEnd(feed: Feed): void {
        // clean up here
        this.prevPixels = undefined;
    }
    
    async processFrame(jpg: Buffer): Promise<Buffer> {
        if (!this.enabled) {
            return jpg;
        }

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
                sampleInterval: SAMPLE_INTERVAL,
                regions: this.motionRegions || [],
            });

            const maxDiffPixels = Math.floor(width * height / SAMPLE_INTERVAL);
            const diffPercent = diff.count / maxDiffPixels;

            console.log(diffPercent);

            // if (diffPercent >= this.diffThreshold) {
                return await sharp(diff.pixels, {
                    raw: {
                        width,
                        height,
                        channels: 3,
                    }
                })
                    .jpeg()
                    .toBuffer();
            // }
        }

        // no diff, just return original data
        return jpg;
    }
}
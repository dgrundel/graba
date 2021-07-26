import { Feed } from 'hastycam.interface';
import { FeedConsumer } from '../background/feed/FeedConsumer';
import { MotionDetector } from '../background/feed/MotionDetector';
import { VideoRecorder } from '../background/feed/VideoRecorder';
import { FFmpegToJpeg } from './FFmpegToJpeg';

type FFmpegArgs = string[];

export class RtspToJpeg extends FeedConsumer {
    private readonly ffmpegToJpeg: FFmpegToJpeg;
    private readonly motionDetector: MotionDetector;
    private readonly videoRecorder: VideoRecorder;

    constructor(feed: Feed) {
        super(feed);

        this.ffmpegToJpeg = new FFmpegToJpeg(() => this.buildFFmpegArgs(feed));

        this.motionDetector = new MotionDetector(feed);

        this.videoRecorder = new VideoRecorder(feed);
        this.videoRecorder.start();
        this.onFrame(this.videoRecorder.writeFrame);
    }

    buildFFmpegArgs(feed: Feed): FFmpegArgs {
        const filters: string[] = [];
    
        // scale video
        if (feed.scaleFactor) {
            filters.push(`scale='iw*${feed.scaleFactor}:ih*${feed.scaleFactor}'`);  
        }
    
        // set max fps
        const maxFps = feed.maxFps || Feed.DEFAULT_MAX_FPS;
        filters.push(`fps='fps=min(${maxFps},source_fps)'`); 
    
        const qualityLevel = feed.videoQuality || Feed.DEFAULT_VIDEO_QUALITY;
    
        return [
            // '-re', // read input at native frame rate, "good for live streams"
            '-i', feed.streamUrl, // input
            '-filter:v', filters.join(','), 
            '-f', 'image2', // use image processor
            '-c:v', 'mjpeg', // output a jpg
            '-qscale:v', qualityLevel.toString(), // set quality level
            // '-frames:v', '1', // output a single frame
            '-update', '1', // reuse the same output (stdout in this case)
            'pipe:1', // pipe to stdout
            '-hide_banner', // don't output copyright notice, build options, library versions
        ];
    }

    handleFeedUpdate(next: Feed, prev: Feed): void {
        this.videoRecorder.stop();
        
        this.motionDetector.updateFeed(next);
        this.videoRecorder.updateFeed(next);

        this.ffmpegToJpeg.updateArgGenerator(() => this.buildFFmpegArgs(next));

        this.videoRecorder.start();
    }

    handleFeedEnd(feed: Feed): void {
        this.motionDetector.handleFeedEnd(feed);
        this.videoRecorder.handleFeedEnd(feed);

        this.ffmpegToJpeg.stop();
    }

    async getFrame() {
        return this.ffmpegToJpeg.getNextFrame();
    }

    onFrame(handler: (buffer: Buffer) => void): () => void {
        return this.ffmpegToJpeg.onFrame(handler);
    }

    onEnd(handler: () => void) {
        return this.ffmpegToJpeg.onEnd(handler);
    }
}

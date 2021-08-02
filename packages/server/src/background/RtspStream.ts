import { Feed } from 'hastycam.interface';
import { MotionDetector } from '../helpers/MotionDetector';
import { VideoRecorder } from '../helpers/VideoRecorder';
import { FFmpegToJpeg, Frame } from '../helpers/FFmpegToJpeg';
import { EventEmitter } from 'stream';

type FFmpegArgs = string[];

enum Events {
    End = 'RtspStream:end'
}

export class RtspStream {
    private readonly emitter = new EventEmitter();
    private readonly ffmpegToJpeg: FFmpegToJpeg;
    private readonly motionDetector: MotionDetector;
    private readonly videoRecorder?: VideoRecorder;

    constructor(feed: Feed) {
        const ffmpegToJpegOptions = {
            frameProcessor: this.processFrame.bind(this),
        };
        this.ffmpegToJpeg = new FFmpegToJpeg(() => this.buildFFmpegArgs(feed), ffmpegToJpegOptions);
        this.ffmpegToJpeg.onEnd(this.end.bind(this));
        
        this.motionDetector = new MotionDetector(feed);
        
        if (feed.saveVideo) {
            this.videoRecorder = new VideoRecorder(feed);
            this.onFrame(this.videoRecorder.writeFrame);
            this.emitter.on(Events.End, this.videoRecorder.stop);
        }
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

    end() {
        this.ffmpegToJpeg.stop();
        this.emitter.emit(Events.End);
    }

    async getFrame() {
        return this.ffmpegToJpeg.getNextFrame();
    }

    onFrame(handler: (buffer: Frame) => void): () => void {
        return this.ffmpegToJpeg.onFrame(handler);
    }

    onEnd(handler: () => void) {
        this.emitter.once(Events.End, handler);
    }

    private processFrame(frame: Frame): Promise<Frame> {
        return this.motionDetector.processFrame(frame);
    }
}

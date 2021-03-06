import { Feed } from 'graba.interface';
import { MotionDetector } from './MotionDetector';
import { VideoRecorder } from './VideoRecorder';
import { FFmpegToJpeg, Frame } from './FFmpegToJpeg';
import { MotionAlert } from './MotionAlert';
import { EventEmitter } from 'stream';

enum Events {
    End = 'RtspStream:end'
}

export class RtspStream {
    private readonly emitter = new EventEmitter();
    private readonly ffmpegToJpeg: FFmpegToJpeg;
    private readonly motionDetector: MotionDetector;
    private readonly videoRecorder?: VideoRecorder;
    private readonly motionAlert?: MotionAlert;

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

        if (feed.alertOnMotion) {
            this.motionAlert = new MotionAlert(feed);
            this.onFrame(this.motionAlert.onFrame);
        }
    }

    buildFFmpegArgs(feed: Feed): string[] {
        const filters: string[] = [];
    
        // scale video
        if (feed.scaleFactor !== 1.0) {
            filters.push(`scale='iw*${feed.scaleFactor}:ih*${feed.scaleFactor}'`);  
        }
    
        // set max fps
        filters.push(`fps='fps=min(${feed.maxFps},source_fps)'`); 
    
        return [
            // '-re', // read input at native frame rate, "good for live streams"
            '-i', feed.streamUrl, // input
            '-filter:v', filters.join(','), 
            '-f', 'image2', // use image processor
            '-c:v', 'mjpeg', // output a jpg
            '-qscale:v', feed.videoQuality.toString(), // set quality level
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

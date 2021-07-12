import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { Feed } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';

// https://docs.fileformat.com/image/jpeg/
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

type FFmpegArgs = string[];

export class JpegStream extends FeedConsumer {
    private ffmpeg: ChildProcess;
    private buffer?: Buffer;
    private readonly emitter = new EventEmitter();

    constructor(feed: Feed) {
        super(feed);

        // bind handlers before using this in spawn
        this.ffmpegDataHandler = this.ffmpegDataHandler.bind(this);
        this.ffmpegCloseHandler = this.ffmpegCloseHandler.bind(this);
        this.ffmpegErrorHandler = this.ffmpegErrorHandler.bind(this);

        this.ffmpeg = this.spawnFFmpeg(this.buildFFmpegArgs(feed));
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
            '-i', feed.streamUrl, // input
            '-filter:v', filters.join(','), 
            '-f', 'image2', // use image processor
            '-c:v', 'mjpeg', // output a jpg
            '-qscale:v', qualityLevel.toString(), // set quality level
            // '-frames:v', '1', // output a single frame
            '-update', '1', // reuse the same output (stdout in this case)
            'pipe:1', // pipe to stdout
        ];
    }

    spawnFFmpeg(ffmpegArgs: FFmpegArgs): ChildProcess {
        const ff = spawn('ffmpeg', ffmpegArgs);
        ff.stdout.on('data', this.ffmpegDataHandler);
        ff.on('close', this.ffmpegCloseHandler);
        ff.on('error', this.ffmpegErrorHandler);

        return ff;
    }

    onFeedUpdate(next: Feed, prev: Feed): void {
        // build args for old feed
        const prevArgs = this.buildFFmpegArgs(prev);

        // build args for new FFmpeg process
        const newFFmpegArgs = this.buildFFmpegArgs(next);

        // check to see if we need to restart ffmpeg
        if (prevArgs.join(' ') === newFFmpegArgs.join(' ')) {
            // args are same, no need to restart
            return;
        }

        // unbind handlers
        this.ffmpeg.stdout!.off('data', this.ffmpegDataHandler);
        this.ffmpeg.off('close', this.ffmpegCloseHandler);
        this.ffmpeg.off('error', this.ffmpegErrorHandler);

        // kill ffmpeg process
        if (!this.ffmpeg.kill()) {
            throw new Error('Error killing ffmpeg process');
        }

        // clear buffer
        this.buffer = undefined;

        // respawn ffmpeg
        this.ffmpeg = this.spawnFFmpeg(newFFmpegArgs);
    }

    onFeedEnd(feed: Feed): void {
        // kill ffmpeg process
        if (!this.ffmpeg.kill()) {
            throw new Error('Error killing ffmpeg process');
        }
    }

    ffmpegCloseHandler(code: number) {
        const feed = this.getFeed();
        console.log(`ffmpeg for feed "${feed.name}" [${feed.id}] exited with code ${code}`);
        this.emitter.emit(JpegStream.Events.StreamEnd);
    }

    ffmpegErrorHandler(err: Error) {
        const feed = this.getFeed();
        console.error(`Error in ffmpeg for feed "${feed.name}" [${feed.id}].`, err);
    }

    ffmpegDataHandler(data: Buffer) {
        const isStart = Buffer.compare(data.slice(0, 2), JPG_START) === 0;
        const isEnd = Buffer.compare(data.slice(-2), JPG_END) === 0;

        if (isStart) {
            this.buffer = data;
        } else {
            this.buffer = Buffer.concat([
                this.buffer!,
                data,
            ]);
        }
            
        if (isEnd) {
            this.emitter.emit(JpegStream.Events.JpegFrame, this.buffer);

            // new Promise(resolve => {
            //     fs.writeFile(`output-${this.name}-${+new Date()}.jpg`, this.buffer!, resolve);
            // });
        }
    }

    async getFrame() {
        return new Promise<Buffer>(resolve => {
            this.emitter.once(JpegStream.Events.JpegFrame, buffer => resolve(buffer));
        });
    }

    onFrame(handler: (buffer: Buffer) => void): () => void {
        this.emitter.on(JpegStream.Events.JpegFrame, handler);

        // return an unsubscribe fn
        return () => this.emitter.off(JpegStream.Events.JpegFrame, handler);
    }

    onEnd(handler: () => void) {
        this.emitter.once(JpegStream.Events.StreamEnd, handler);
    }
}

export namespace JpegStream {
    export enum Events {
        JpegFrame = 'jpeg-frame',
        StreamEnd = 'stream-end',
    };
}
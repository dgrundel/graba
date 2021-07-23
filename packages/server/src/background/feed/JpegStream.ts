import { performance } from 'perf_hooks';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { Feed } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import { MotionDetector } from './MotionDetector';
import { VideoRecorder } from './VideoRecorder';
import { Chain } from '../Chain';

type FFmpegArgs = string[];

interface FrameData {
    data: Buffer;
    time: number;
}

export class JpegStream extends FeedConsumer {
    private readonly emitter = new EventEmitter();
    private readonly motionDetector: MotionDetector;
    private readonly videoRecorder: VideoRecorder;
    private readonly frameChain: Chain<FrameData>;
    private ffmpeg: ChildProcess;

    constructor(feed: Feed) {
        super(feed);

        // bind handlers before using this in spawn
        this.ffmpegCloseHandler = this.ffmpegCloseHandler.bind(this);
        this.ffmpegErrorHandler = this.ffmpegErrorHandler.bind(this);
        this.ffmpegMetadataHandler = this.ffmpegMetadataHandler.bind(this);
        this.ffmpegDataHandler = this.ffmpegDataHandler.bind(this);

        this.motionDetector = new MotionDetector(feed);

        this.videoRecorder = new VideoRecorder(feed);
        this.videoRecorder.start();
        this.onFrame(this.videoRecorder.writeFrame);

        this.frameChain = new Chain(this.chainProcessor.bind(this));
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
            '-re', // read input at native frame rate, "good for live streams"
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

    spawnFFmpeg(ffmpegArgs: FFmpegArgs): ChildProcess {
        const ff = spawn('ffmpeg', ffmpegArgs);
        ff.on('close', this.ffmpegCloseHandler);
        ff.on('error', this.ffmpegErrorHandler);
        ff.stderr.on('data', this.ffmpegMetadataHandler);
        ff.stdout.on('data', this.ffmpegDataHandler);

        return ff;
    }

    handleFeedUpdate(next: Feed, prev: Feed): void {
        this.videoRecorder.stop();
        
        this.motionDetector.updateFeed(next);
        this.videoRecorder.updateFeed(next);

        // build args for old feed
        const prevArgs = this.buildFFmpegArgs(prev);

        // build args for new FFmpeg process
        const newFFmpegArgs = this.buildFFmpegArgs(next);

        // check to see if we need to restart ffmpeg
        if (prevArgs.join(' ') !== newFFmpegArgs.join(' ')) {
            // unbind handlers
            this.ffmpeg.off('close', this.ffmpegCloseHandler);
            this.ffmpeg.off('error', this.ffmpegErrorHandler);
            this.ffmpeg.stderr?.off('data', this.ffmpegMetadataHandler);
            this.ffmpeg.stdout?.off('data', this.ffmpegDataHandler);

            // kill ffmpeg process
            if (!this.ffmpeg.kill()) {
                throw new Error('Error killing ffmpeg process');
            }

            // respawn ffmpeg
            this.ffmpeg = this.spawnFFmpeg(newFFmpegArgs);
        }

        this.videoRecorder.start();
    }

    handleFeedEnd(feed: Feed): void {
        this.motionDetector.handleFeedEnd(feed);
        this.videoRecorder.handleFeedEnd(feed);

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

    ffmpegMetadataHandler(buffer: Buffer) {
        // frame=  188 fps= 11 q=24.0 size=N/A time=00:00:18.60 bitrate=N/A speed=1.06x
        // const s = buffer.toString().trim();
        // if (s.startsWith('frame=')) {
        //     const props = s.replace(/\s*\=\s*/g, '=')
        //         .split(/\s+/g)
        //         .reduce((map: Record<string, string>, pair: string) => {
        //             const [key, value] = pair.split('=');
        //             map[key] = value;
        //             return map;
        //         }, {});

        //     console.log({ props });
        // } else {
            console.error(`[ffmpeg][${this.getFeed().id}] ${buffer.toString()}`);
        // }
    }

    ffmpegDataHandler(data: Buffer) {
        this.frameChain.put({ data, time: performance.now() });
    }

    async chainProcessor(frameData: FrameData, prev?: FrameData) {
        const data = frameData.data;
        
        // https://docs.fileformat.com/image/jpeg/
        // first two bytes should be [ff d8]
        const isStart = data[0] === 0xff && data[1] === 0xd8;
        // last two bytes should be [ff d9]
        const isEnd = data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9;
        
        const buffer = isStart ? data : Buffer.concat([ prev!.data, data ]);
        const time = isStart ? frameData.time : prev!.time;

        if (isEnd) {
            const frame = await this.motionDetector.processFrame(buffer);

            this.emitter.emit(JpegStream.Events.JpegFrame, frame, time);

            return { data: frame, time };
        } else {
            return { data: buffer, time };
        }
    }

    async getFrame() {
        return new Promise<Buffer>(resolve => {
            this.emitter.once(JpegStream.Events.JpegFrame, buffer => resolve(buffer));
        });
    }

    onFrame(handler: (buffer: Buffer, time: number) => void): () => void {
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

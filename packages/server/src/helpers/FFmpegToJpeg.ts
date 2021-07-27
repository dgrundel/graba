import { Chain } from './Chain';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';

type FFmpegArgs = string[];
type FFmpegArgGenerator = () => string[];

interface Options {
    debug?: boolean;
};

const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

const enum Events {
    JpegFrame = 'jpeg-frame',
    StreamEnd = 'stream-end',
};

export class FFmpegToJpeg {
    private readonly options?: Options;
    private readonly emitter = new EventEmitter();
    private readonly frameChain: Chain<Buffer>;
    
    private argGenerator: FFmpegArgGenerator;
    private ffmpeg: ChildProcess;

    constructor(argGenerator: FFmpegArgGenerator, options?: Options) {
        this.argGenerator = argGenerator;
        this.options = options;

        // bind handlers before using this in spawn
        this.ffmpegCloseHandler = this.ffmpegCloseHandler.bind(this);
        this.ffmpegErrorHandler = this.ffmpegErrorHandler.bind(this);
        this.ffmpegStderrHandler = this.ffmpegStderrHandler.bind(this);

        this.frameChain = new Chain(this.chainProcessor.bind(this));
        this.ffmpeg = this.start(argGenerator());
    }

    start(args: FFmpegArgs): ChildProcess {
        const ff = spawn('ffmpeg', args);
        ff.on('close', this.ffmpegCloseHandler);
        ff.on('error', this.ffmpegErrorHandler);
        ff.stderr.on('data', this.ffmpegStderrHandler);
        ff.stdout.on('data', this.frameChain.put);

        this.ffmpeg = ff;
        return ff;
    }

    stop(): void {
        // unbind handlers
        this.ffmpeg.off('close', this.ffmpegCloseHandler);
        this.ffmpeg.off('error', this.ffmpegErrorHandler);
        this.ffmpeg.stderr?.off('data', this.ffmpegStderrHandler);
        this.ffmpeg.stdout?.off('data', this.frameChain.put);

        // kill ffmpeg process
        if (this.ffmpeg.connected && !this.ffmpeg.kill()) {
            throw new Error('Error killing ffmpeg process');
        }
    }

    updateArgGenerator(next: FFmpegArgGenerator): void {
        // build args for old feed
        const prevArgs = this.argGenerator();

        // build args for new FFmpeg process
        this.argGenerator = next;
        const newFFmpegArgs = this.argGenerator();

        // check to see if we need to restart ffmpeg
        if (prevArgs.join(' ') !== newFFmpegArgs.join(' ')) {
            this.stop();

            // respawn ffmpeg
            this.start(newFFmpegArgs);
        }
    }

    async getNextFrame() {
        return new Promise<Buffer>(resolve => {
            this.emitter.once(Events.JpegFrame, buffer => resolve(buffer));
        });
    }

    onFrame(handler: (buffer: Buffer) => void): () => void {
        this.emitter.on(Events.JpegFrame, handler);

        // return an unsubscribe fn
        return () => this.emitter.off(Events.JpegFrame, handler);
    }

    onEnd(handler: () => void) {
        this.emitter.on(Events.StreamEnd, handler);

        // return an unsubscribe fn
        return () => this.emitter.off(Events.StreamEnd, handler);
    }

    private ffmpegCloseHandler(code: number) {
        this.options?.debug && console.log('[ffmpeg][close]', `exited with code ${code}`);
        this.emitter.emit(Events.StreamEnd);
    }

    private ffmpegErrorHandler(err: Error) {
        this.options?.debug && console.error('[ffmpeg][error]', err);
    }

    private ffmpegStderrHandler(buffer: Buffer) {
        this.options?.debug && console.error('[ffmpeg][stderr]', buffer.toString());
    }

    private async chainProcessor(data: Buffer, prev?: Buffer) {
        let buffer = prev ? Buffer.concat([ prev, data ]) : data;
        let start = buffer.indexOf(JPG_START);
        
        while (start !== -1) {
            // look for EOI marker [ff d9] after start marker
            let endMarker = buffer.indexOf(JPG_END, start + JPG_START.length);
            if (endMarker === -1) {
                break;
            }
            
            const end = endMarker + JPG_END.length;
            const frame = buffer.slice(start, end);
            this.emitter.emit(Events.JpegFrame, frame);
            
            buffer = buffer.slice(end);
            start = buffer.indexOf(JPG_START);
        }

        return buffer;
    }
}



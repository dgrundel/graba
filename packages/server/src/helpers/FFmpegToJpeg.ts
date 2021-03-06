import { Chain } from './Chain';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { logger } from './functional/logger';

type FFmpegArgs = string[];
type FFmpegArgGenerator = () => string[];

export interface Frame {
    buffer: Buffer;
    motionDetected?: boolean;
    isMotionStart?: boolean;
    isMotionEnd?: boolean;
}

interface Options {
    debug?: boolean;
    frameProcessor?: (f: Frame) => Promise<Frame>;
};

const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

const enum Events {
    JpegFrame = 'jpeg-frame',
    StreamEnd = 'stream-end',
};

export class FFmpegToJpeg {
    private readonly emitter = new EventEmitter();
    private readonly frameChain: Chain<Buffer>;

    // options
    private readonly isDebug: boolean;
    private readonly frameProcessor?: (f: Frame) => Promise<Frame>;
    
    private ffmpeg: ChildProcess;

    constructor(argGenerator: FFmpegArgGenerator, options?: Options) {
        // options
        this.isDebug = options?.debug === true;
        this.frameProcessor = options?.frameProcessor;

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
        return ff;
    }

    stop(): void {
        // unbind handlers
        this.ffmpeg.off('close', this.ffmpegCloseHandler);
        this.ffmpeg.off('error', this.ffmpegErrorHandler);
        this.ffmpeg.stderr?.off('data', this.ffmpegStderrHandler);
        this.ffmpeg.stdout?.off('data', this.frameChain.put);

        // kill ffmpeg process
        this.ffmpeg.kill('SIGINT');
    }

    async getNextFrame(): Promise<Frame> {
        return new Promise<Frame>(resolve => {
            this.emitter.once(Events.JpegFrame, buffer => resolve(buffer));
        });
    }

    onFrame(handler: (buffer: Frame) => void): () => void {
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
        logger.debug(`[ffmpeg][close] exited with code ${code}`);
        this.emitter.emit(Events.StreamEnd);
    }

    private ffmpegErrorHandler(err: Error) {
        logger.debug('[ffmpeg][error]', err);
    }

    private ffmpegStderrHandler(buffer: Buffer) {
        logger.silly('[ffmpeg][stderr]', buffer.toString());
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
            const frame: Frame = {
                buffer: buffer.slice(start, end),
            };
            const processed = this.frameProcessor ? (await this.frameProcessor(frame)) : frame;

            this.emitter.emit(Events.JpegFrame, processed);
            
            buffer = buffer.slice(end);
            start = buffer.indexOf(JPG_START);
        }

        return buffer;
    }
}



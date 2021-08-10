import { Feed, VideoRecord } from 'graba.interface';
import fs from 'fs';
import { createVideoRecord, updateRecord } from '../background/VideoStorage';
import { onExit } from './util';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { Frame } from './FFmpegToJpeg';
import { Chain } from './Chain';
import { logger } from './logger';

export class VideoRecording {
    private readonly feed: Feed;
    private readonly record: VideoRecord;
    private readonly ffmpeg: ChildProcess;
    private readonly chain: Chain<Frame>;
    private readonly offExit: () => void;

    constructor(feed: Feed) {
        if (!feed.saveVideo) {
            throw new Error(`Feed ${feed.name} [${feed.id}] is not configured to save video`);
        }

        if (!feed.savePath) {
            throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
        }

        this.stop = this.stop.bind(this);
        this.writeFrame = this.writeFrame.bind(this);

        this.feed = feed;
        this.record = createVideoRecord(feed);
        this.ffmpeg = this.startFFmpeg(this.record.path);
        this.chain = new Chain(this.chainProcessor.bind(this));
        this.offExit = onExit(this.stop);
    }

    stop() {
        // remove exit listener
        this.offExit();

        if (this.chain.isEnded()) {
            return;
        }

        this.chain.end().then(() => {
            this.ffmpeg.kill();
            const stats = fs.statSync(this.record.path);
    
            updateRecord({
                id: this.record.id,
                endTime: Date.now(),
                byteLength: stats.size,
            });
        });
    }

    writeFrame(frame: Frame) {
        this.chain.put(frame);
    }

    private startFFmpeg(outfile: string) {
        const args = [
            // use current time as timestamp for each frame
            // we're piping in frames in real time, so use the
            // actual current time as the timestamp
            '-use_wallclock_as_timestamps', '1', 
            // get input piped from stdin
            '-f', 'image2pipe',
            // input format is jpeg
            '-c:v', 'mjpeg',
            // input file is stdin/pipe
            '-i', '-',
            '-codec', 'copy',
            outfile,
        ];

        const ffmpeg = spawn('ffmpeg', args);
        ffmpeg.on('close', this.ffmpegClose.bind(this));
        ffmpeg.on('error', this.ffmpegError.bind(this));
        ffmpeg.stderr!.on('data', this.ffmpegStderr.bind(this));
        ffmpeg.stdout!.on('data', this.ffmpegStdout.bind(this));
        return ffmpeg;
    }
    
    private ffmpegClose (code: number) {
        logger.debug('[ffmpeg]', `Exited with code ${code}`);
    }
    
    private ffmpegError (err: Error) {
        logger.debug('[ffmpeg][ERROR]', err);
    }
    
    private ffmpegStderr (buffer: Buffer) {
        logger.silly('[ffmpeg][stderr]', buffer.toString());
    }

    private ffmpegStdout (buffer: Buffer) {
        logger.debug('[ffmpeg][stdout]', buffer.toString());
    }
    
    private async chainProcessor(frame: Frame, prev?: Frame): Promise<Frame> {
        const buffer = frame.buffer;
        const data = Buffer.concat([
            buffer,
            Buffer.from('\n'),
        ]);

        if (!this.record.thumbnailPath) {
            this.writeThumbnail(buffer);
        }

        if (!this.ffmpeg.stdin) {
            throw new Error('ffmpeg has no stdin');
        }

        this.ffmpeg.stdin.write(data);
        return frame;
    }

    private writeThumbnail(buffer: Buffer) {
        const savePath = this.feed.savePath!;
        const thumbnailPath = path.join(savePath, this.record.id + '.jpg');

        // write data
        fs.createWriteStream(thumbnailPath).end(buffer);

        // update record here and there
        this.record.thumbnailPath = thumbnailPath;
        updateRecord({
            id: this.record.id,
            thumbnailPath: this.record.thumbnailPath,
        });
    }
}
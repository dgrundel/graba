import { Feed, VideoRecord } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import fs from 'fs';
import { createVideoRecord, updateRecord } from '../background/VideoStorage';
import { onExit } from './util';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { Frame } from './FFmpegToJpeg';

const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 hr

export class VideoRecorder extends FeedConsumer {
    private record?: VideoRecord;
    private ffmpeg?: ChildProcess;
    private timeout?: NodeJS.Timeout;
    private rotateInterval?: number = 60 * 60 * 1000; // 1 hr

    constructor(feed: Feed) {
        super(feed);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.restart = this.restart.bind(this);
        this.writeFrame = this.writeFrame.bind(this);
        this.initTimer = this.initTimer.bind(this);
        
        onExit(this.stop);
        this.start();
    }

    handleFeedUpdate(next: Feed, prev: Feed): void {
        this.restart();
    }

    handleFeedEnd(feed: Feed): void {
        this.stop();
    }

    start() {
        if (!this.isEnabled()) {
            return;
        }

        const feed = this.getFeed();
        const savePath = feed.savePath;

        if (!savePath) {
            throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
        }

        this.record = createVideoRecord(this.getFeed());
        this.startFFmpeg(this.record.path);

        this.initTimer();
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.ffmpeg) {
            // kill ffmpeg process
            if (!this.ffmpeg.kill()) {
                throw new Error('Error killing ffmpeg process');
            }
            this.ffmpeg = undefined;
        }

        if (this.record) {
            const stats = fs.statSync(this.record.path);

            updateRecord({
                id: this.record.id,
                endTime: Date.now(),
                byteLength: stats.size,
            });

            this.record = undefined;
        }
    }

    restart() {
        this.stop();
        this.start();
    }

    writeFrame(frame: Frame) {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.ffmpeg) {
            return;
        }

        const buffer = frame.buffer;
        const data = Buffer.concat([
            buffer,
            Buffer.from('\n'),
        ]);

        if (!this.record?.thumbnailPath) {
            this.writeThumbnail(buffer);
        }

        this.ffmpeg.stdin?.write(data);
    }
    
    private isEnabled() {
        return this.getFeed().saveVideo === true;
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

        this.ffmpeg = spawn('ffmpeg', args);
        this.ffmpeg.on('close', this.ffmpegClose.bind(this));
        this.ffmpeg.on('error', this.ffmpegError.bind(this));
        this.ffmpeg.stderr!.on('data', this.ffmpegStderr.bind(this));
        this.ffmpeg.stdout!.on('data', this.ffmpegStdout.bind(this));
    }
    
    private ffmpegClose (code: number) {
        // console.log('[ffmpeg]', `Exited with code ${code}`);
    }
    
    private ffmpegError (err: Error) {
        // console.error('[ffmpeg][ERROR]', err);
    }
    
    private ffmpegStderr (buffer: Buffer) {
        // console.error('[ffmpeg][stderr]', buffer.toString());
    }

    private ffmpegStdout (buffer: Buffer) {
        // console.error('[ffmpeg][stdout]', buffer.toString());
    }

    private writeThumbnail(buffer: Buffer) {
        if (!this.record) {
            return;
        }

        const savePath = this.getFeed().savePath;
        if (!savePath) {
            return;
        }

        this.record.thumbnailPath = path.join(savePath, this.record.id + '.jpg');

        const out = fs.createWriteStream(this.record.thumbnailPath);
        out.write(buffer);
        out.close();

        updateRecord({
            id: this.record.id,
            thumbnailPath: this.record.thumbnailPath,
        });
    }

    private initTimer() {
        if (!this.rotateInterval) {
            // do nothing if no rotation interval set
            return;
        }

        const now = Date.now();
        // the number of mills remaining until midnight, UTC
        const remaining = ONE_DAY_MS - (now % ONE_DAY_MS);
        // since we'd like to break up videos cleanly on the day, 
        // we work back from midnight to figure out how long to wait
        const delay = remaining % this.rotateInterval;
        this.timeout = setTimeout(this.restart, delay);
    }
}
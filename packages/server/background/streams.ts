import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { Feed } from 'hastycam.interface';
import { config } from './config';
// const fs = require('fs');
// const path = require('path');
// const sharp = require('sharp');

const QUALITY_LEVEL = 24;
const MAX_FRAME_RATE = 10;

// https://docs.fileformat.com/image/jpeg/
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

export enum StreamEventType {
    JpgChunk = "JPEG_CHUNK",
    JpgComplete = "JPEG_COMPLETE",
    FeedClose = "FEED_CLOSE",
}

export interface StreamEvent {
    id: string;
    isStart: boolean;
    isEnd: boolean;
    data?: Buffer;
}

const streams: Record<string, Stream> = {};

class Stream extends EventEmitter {
    readonly id: string;
    feed: Feed;
    ffmpeg: ChildProcess;
    buffer?: Buffer;

    constructor(feed: Feed) {
        super();

        // bind handlers before using this in spawn
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);

        this.id = feed.id;
        this.feed = feed;
        this.ffmpeg = this.spawnFFmpeg(feed.streamUrl);

        streams[feed.id] = this;
    }

    spawnFFmpeg(url: string): ChildProcess {
        const ffmpegArgs = [
            '-i', url, // input
            '-filter:v', `fps='fps=min(${MAX_FRAME_RATE},source_fps)'`, // set max fps
            '-f', 'image2', // use image processor
            '-c:v', 'mjpeg', // output a jpg
            '-qscale:v', QUALITY_LEVEL.toString(), // set quality level
            // '-frames:v', '1', // output a single frame
            '-update', '1', // reuse the same output (stdout in this case)
            'pipe:1', // pipe to stdout
        ];
        
        const ff = spawn('ffmpeg', ffmpegArgs);
        ff.stdout.on('data', this.onData);
        ff.on('close', this.onClose);
        ff.on('error', this.onError);

        return ff;
    }

    updateFeed(feed: Feed) {
        if (feed.id !== this.id) {
            throw new Error(`Bad feed id. This: ${this.id}, Update: ${feed.id}`);
        }

        // update feed
        this.feed = feed;

        if (feed.streamUrl === this.feed.streamUrl) {
            // do nothing if URLs are same
            return;
        }

        // unbind handlers
        this.ffmpeg.stdout!.off('data', this.onData);
        this.ffmpeg.off('close', this.onClose);
        this.ffmpeg.off('error', this.onError);

        // kill ffmpeg process
        if (!this.ffmpeg.kill()) {
            throw new Error('Error killing ffmpeg process');
        }

        // clear buffer
        this.buffer = undefined;

        // respawn ffmpeg
        this.ffmpeg = this.spawnFFmpeg(feed.streamUrl);
    }

    emit(eventName: StreamEventType, data?: StreamEvent): boolean {
        return super.emit(eventName, data)
    }

    on(eventName: StreamEventType, listener: (data: StreamEvent) => void) {
        super.on(eventName, listener);
        return this;
    }

    onClose(code: number) {
        console.log(`child process for feed "${this.id}" exited with code ${code}`);
        
        // remove from feed list on close
        const id = this.id;
        delete streams[id];

        this.emit(StreamEventType.FeedClose, { 
            id,
            isStart: false,
            isEnd: false,
            data: undefined
        });
    }

    onError(err: Error) {
        console.error(`Error in subprocess for feed "${this.id}".`, err);
    }

    onData(data: Buffer) {
        const id = this.id;
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

        this.emit(StreamEventType.JpgChunk, {
            id,
            isStart,
            isEnd,
            data
        });
            
        if (isEnd) {
            this.emit(StreamEventType.JpgComplete, {
                id,
                isStart,
                isEnd,
                data: this.buffer!
            });

            // new Promise(resolve => {
            //     fs.writeFile(`output-${this.name}-${+new Date()}.jpg`, this.buffer!, resolve);
            // });
        }
    }
}

export const getStream = (id: string): Stream | undefined => {
    return streams[id];
};

export const addStream = (feed: Feed): Stream => {
    const existing = getStream(feed.id);

    if (existing) {
        // check to see if stream url was changed
        if (existing.feed.streamUrl !== feed.streamUrl) {
            // url changed, so something
        }

        // do nothing
    } else {
        new Stream(feed);
    }

    return getStream(feed.id)!;
};

export const getAllStreams = (): Stream[] => {
    return Object.values(streams);
};

export const start = () => {
    // set up feeds
    config.get('feeds').forEach(feed => {
        addStream(feed);
    });
};
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { config } from './config';
// const fs = require('fs');
// const path = require('path');
// const sharp = require('sharp');

const QUALITY_LEVEL = 24;
const MAX_FRAME_RATE = 10;

// https://docs.fileformat.com/image/jpeg/
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

const feeds: Record<string, Feed> = {};

export enum FeedEventType {
    JpgChunk = "JPEG_CHUNK",
    JpgComplete = "JPEG_COMPLETE",
    FeedClose = "FEED_CLOSE",
}

export interface FeedEvent {
    name: string;
    isStart: boolean;
    isEnd: boolean;
    data?: Buffer;
}

class Feed extends EventEmitter {
    readonly name: string;
    readonly ffmpeg: ChildProcess;
    buffer?: Buffer;

    constructor(name: string, url: string) {
        super();

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
        ff.stdout.on('data', this.onData.bind(this));
        ff.on('close', this.onClose.bind(this));
        ff.on('error', this.onError.bind(this));

        this.name = name;
        this.ffmpeg = ff;

        feeds[name] = this;
    }

    emit(eventName: FeedEventType, data?: FeedEvent): boolean {
        return super.emit(eventName, data)
    }

    on(eventName: FeedEventType, listener: (data: FeedEvent) => void) {
        super.on(eventName, listener);
        return this;
    }

    onClose(code: number) {
        console.log(`child process for feed "${this.name}" exited with code ${code}`);
        
        // remove from feed list on close
        const name = this.name;
        delete feeds[name];

        this.emit(FeedEventType.FeedClose, { 
            name,
            isStart: false,
            isEnd: false,
            data: undefined
        });
    }

    onError(err: Error) {
        console.error(`Error in subprocess for feed "${this.name}".`, err);
    }

    onData(data: Buffer) {
        const name = this.name;
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

        this.emit(FeedEventType.JpgChunk, {
            name,
            isStart,
            isEnd,
            data
        });
            
        if (isEnd) {
            this.emit(FeedEventType.JpgComplete, {
                name,
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

export const addFeed = (name: string, url: string): Feed => {
    return new Feed(name, url);
};

export const getFeed = (name: string): Feed | undefined => {
    return feeds[name];
};

export const getAllFeeds = (): Feed[] => {
    return Object.values(feeds);
};

export const start = () => {
    // set up feeds
    config.get('feeds').forEach(feed => {
        addFeed(feed.name, feed.streamUrl);
    });
};
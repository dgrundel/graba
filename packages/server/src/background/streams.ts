import { Feed } from 'hastycam.interface';
import { config } from './config';
import { RtspToJpeg } from './RtspToJpeg';

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

const streams: Record<string, RtspToJpeg> = {};

export const getStream = (id: string): RtspToJpeg | undefined => {
    return streams[id];
};

export const addStream = (feed: Feed): RtspToJpeg => {
    const existing = getStream(feed.id);

    if (existing) {
        return existing;
    }

    streams[feed.id] = new RtspToJpeg(feed);
    return streams[feed.id];
};

export const getAllStreams = (): RtspToJpeg[] => {
    return Object.values(streams);
};

export const start = () => {
    const feeds = config.get('feeds');
    // set up feeds
    feeds.forEach(feed => {
        addStream(feed);
    });
};
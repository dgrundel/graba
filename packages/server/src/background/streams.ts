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

export const deleteStream = (id: string): void => {
    // first attempt to kill the stream if active
    const existing = getStream(id);
    if (existing) {
        existing.endFeed();
        delete streams[id];
    }

    // next remove from config if present
    const feeds = config.get('feeds');
    const i = feeds.findIndex(f => f.id === id);
    if (i !== -1) {
        feeds.splice(i, 1);
        config.set('feeds', feeds);
    }
};

export const start = () => {
    const feeds = config.get('feeds');
    // set up feeds
    feeds.forEach(feed => {
        addStream(feed);
    });
};
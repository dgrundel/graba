import { Feed } from 'graba.interface';
import { config } from './config';
import { RtspStream } from './RtspStream';

const streams: Record<string, RtspStream> = {};

export const getStream = (id: string): RtspStream | undefined => {
    return streams[id];
};

export const startStream = (feed: Feed): RtspStream => {
    const existing = streams[feed.id];

    if (existing) {
        return existing;
    }

    streams[feed.id] = new RtspStream(feed);
    return streams[feed.id];
};

export const stopStream = (id: string) => {
    const stream = streams[id];
    if (stream) {
        stream.end();
        delete streams[id];
    }
}

export const updateStream = (feed: Feed) => {
    stopStream(feed.id);
    startStream(feed);
};

export const start = () => {
    // set up feeds
    config.feeds.forEach(feed => {
        startStream(feed);
    });
};
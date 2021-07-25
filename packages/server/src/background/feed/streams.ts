import { Feed } from 'hastycam.interface';
import { config } from '../config';
import { JpegStream } from './JpegStream';

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

const streams: Record<string, JpegStream> = {};

export const getStream = (id: string): JpegStream | undefined => {
    return streams[id];
};

export const addStream = (feed: Feed): JpegStream => {
    const existing = getStream(feed.id);

    if (existing) {
        // check to see if stream url was changed
        if (existing.getFeed().streamUrl !== feed.streamUrl) {
            // url changed, do something
        }

        return existing;
    }

    streams[feed.id] = new JpegStream(feed);
    return streams[feed.id];
};

export const getAllStreams = (): JpegStream[] => {
    return Object.values(streams);
};

export const start = () => {
    const feeds = config.get('feeds');
    // set up feeds
    feeds.forEach(feed => {
        addStream(feed);
    });
};
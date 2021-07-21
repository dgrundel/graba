import { Feed, VideoRecord } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import fs from 'fs';
import { createVideoRecord, updateRecord } from './VideoStorage';
import { onExit } from '../util';

export class VideoRecorder extends FeedConsumer {
    private writeStream?: fs.WriteStream;
    private record?: VideoRecord;

    constructor(feed: Feed) {
        super(feed);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.write = this.write.bind(this);

        onExit(this.stop);
    }

    handleFeedUpdate(next: Feed, prev: Feed): void {
        // noop
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
        this.writeStream = fs.createWriteStream(this.record.path);
    }

    stop() {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = undefined;
        }
        if (this.record) {
            updateRecord({
                id: this.record.id,
                end: Date.now()
            })
            this.record = undefined;
        }
    }

    write(data: Buffer) {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.writeStream) {
            return;
        }

        this.writeStream.write(data);
    }

    private isEnabled() {
        return this.getFeed().saveVideo === true;
    }
}
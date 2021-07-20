import { Feed } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import fs from 'fs';
import { createFile } from './VideoStorage';

export class VideoRecorder extends FeedConsumer {
    private writeStream?: fs.WriteStream;

    constructor(feed: Feed) {
        super(feed);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.write = this.write.bind(this);
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

        const filePath = createFile(this.getFeed());
        this.writeStream = fs.createWriteStream(filePath);
    }

    stop() {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = undefined;
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
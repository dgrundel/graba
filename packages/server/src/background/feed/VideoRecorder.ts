import { Feed, VideoRecord } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import fs from 'fs';
import { createVideoRecord, updateRecord } from './VideoStorage';
import { onExit } from '../util';

export class VideoRecorder extends FeedConsumer {
    private writeStream?: fs.WriteStream;
    private record?: VideoRecord;
    private prevTime?: number;

    constructor(feed: Feed) {
        super(feed);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.writeFrame = this.writeFrame.bind(this);

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

        this.prevTime = undefined;
    }

    writeFrame(data: Buffer, time: number) {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.writeStream) {
            return;
        }

        // write first two bytes, should be [ff d8]
        const start = data.slice(0, 2);
        this.writeStream.write(start);

        // compute metadata
        const metadata = {
            time,
            elapsed: this.prevTime ? (time - this.prevTime) : 0,
        };
        
        // generate a buffer of some metadata as a json string
        const metaBytes: Buffer = Buffer.from(JSON.stringify(metadata));

        // get a two-byte buffer with the length of the json
        const dataView = new DataView(new ArrayBuffer(2));
        dataView.setInt16(0, metaBytes.length, false); // big endian
        const metaLength = Buffer.from(dataView.buffer);

        // put a jpg comment together and write it
        // jpg comment is [0xff, 0xfe, ...[{two byte length}], ...[{the comment bytes}]]
        const comment = Buffer.concat([
            Buffer.from([0xff, 0xfe]),
            metaLength,
            metaBytes,
        ]);
        this.writeStream.write(comment);

        // write the rest of the jpeg data
        const remainder = data.slice(2);
        this.writeStream.write(remainder);

        // set up for net frame
        this.prevTime = time;
    }

    private isEnabled() {
        return this.getFeed().saveVideo === true;
    }
}
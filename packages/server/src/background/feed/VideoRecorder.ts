import { Feed, VideoRecord } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import fs from 'fs';
import { createVideoRecord, updateRecord } from './VideoStorage';
import { onExit } from '../util';

const COMMENT_MARKER = Buffer.from([0xff, 0xfe]);
const COMMENT_LENGTH_FIELD_SIZE = 2; // 16 bit int === 2 bytes

export class VideoRecorder extends FeedConsumer {
    private writeStream?: fs.WriteStream;
    private record?: VideoRecord;

    private prevTime?: number;
    private byteLength: number = 0;

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
                end: Date.now(),
                byteLength: this.byteLength,
            })
            this.record = undefined;
        }

        this.prevTime = undefined;
        this.byteLength = 0;
    }

    write(data: Buffer) {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.writeStream) {
            return;
        }

        this.writeStream.write(data);
        this.byteLength += data.length;
    }

    writeFrame(data: Buffer, time: number) {
        if (!this.isEnabled()) {
            return;
        }

        // write first two bytes, should be [ff d8]
        const start = data.slice(0, 2);
        this.write(start);

        // compute metadata
        const metadata = {
            time,
            elapsed: this.prevTime ? (time - this.prevTime) : 0,
        };
        
        // generate a buffer of some metadata as a json string
        const metaBytes = Buffer.from(JSON.stringify(metadata));
        const metaLength = Buffer.allocUnsafe(2);
        metaLength.writeInt16BE(metaBytes.length + COMMENT_LENGTH_FIELD_SIZE);

        // put a jpg comment together and write it
        // jpg comment is [0xff, 0xfe, ...[{two byte length}], ...[{the comment bytes}]]
        const comment = Buffer.concat([
            COMMENT_MARKER,
            metaLength,
            metaBytes,
        ]);
        this.write(comment);

        // write the rest of the jpeg data
        // removing other comments in jpeg data
        let remainder = data.slice(2);
        let i = remainder.indexOf(COMMENT_MARKER);
        while (i !== -1) {
            // write the buffer up to the found comment
            this.write(remainder.slice(0, i));
            
            // get the length of the comment
            const commentLength = remainder.readInt16BE(i + COMMENT_MARKER.length);
            
            // chop off the comment we found, look for another comment
            remainder = remainder.slice(i + COMMENT_MARKER.length + commentLength);
            i = remainder.indexOf(COMMENT_MARKER);
        }
        
        // write whatever's left
        this.write(remainder);

        // set up for next frame
        this.prevTime = time;
    }

    private isEnabled() {
        return this.getFeed().saveVideo === true;
    }
}
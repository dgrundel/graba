import { Feed } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import { JpegStream } from './jpegStream';

export class MotionDetector extends FeedConsumer {
    private readonly stream: JpegStream

    constructor(feed: Feed, stream: JpegStream) {
        super(feed);

        this.stream = stream;

        stream.onFrame(this.onFrame.bind(this));
    }

    onFeedUpdate(next: Feed, prev: Feed): void {
        // no op
    }

    onFeedEnd(feed: Feed): void {
        // no op
    }
    
    onFrame(buffer: Buffer) {
        
    }
}
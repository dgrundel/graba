import { Feed } from 'hastycam.interface';

export abstract class FeedConsumer {
    private feed: Feed;

    constructor(feed: Feed) {
        this.feed = feed;
    }

    getFeed() {
        return this.feed;
    }

    updateFeed(next: Feed) {
        const prev = this.feed;

        if (next.id !== prev.id) {
            throw new Error(`Bad feed id. Current: ${prev.id}, Update: ${next.id}`);
        }

        this.feed = next;
        this.handleFeedUpdate(next, prev);
    }

    endFeed() {
        this.handleFeedEnd(this.feed);
    }

    abstract handleFeedUpdate(next: Feed, prev: Feed): void;
    abstract handleFeedEnd(feed: Feed): void;
}
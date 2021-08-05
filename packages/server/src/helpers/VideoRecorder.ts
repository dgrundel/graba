import { Feed } from 'hastycam.interface';
import { VideoRecording } from './VideoRecording';
import { Frame } from './FFmpegToJpeg';
import { LimitCounter } from './LimitCounter';

const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 hr

export class VideoRecorder {
    private readonly feed: Feed;
    private readonly rotateInterval: number;
    private readonly motionlessFrames: LimitCounter;
    private recording?: VideoRecording;
    private timeout?: NodeJS.Timeout;

    constructor(feed: Feed) {
        if (!feed.saveVideo) {
            throw new Error(`Feed ${feed.name} [${feed.id}] is not configured to save video`);
        }

        if (!feed.savePath) {
            throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
        }

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.restart = this.restart.bind(this);
        this.writeFrame = this.writeFrame.bind(this);
        this.initTimer = this.initTimer.bind(this);
        
        this.feed = feed;
        this.rotateInterval = 60 * 60 * 1000; // 1 hr

        const motionEndAfterFrameCount = feed.maxFps * (feed.motionEndTimeout || Feed.MIN_MOTION_END_TIMEOUT);
        this.motionlessFrames = new LimitCounter(motionEndAfterFrameCount);
    }

    start() {
        this.recording = new VideoRecording(this.feed);
        this.initTimer();
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.recording) {
            this.recording.stop();
            this.recording = undefined;
        }
    }

    restart() {
        if (this.recording) {
            this.stop();
            this.start();
        }
    }

    writeFrame(frame: Frame) {
        if (frame.motionDetected) {
            // reset count on motion detect
            this.motionlessFrames.reset()
        } else {
            // only increment up to the limit, past that it's pointless
            this.motionlessFrames.increment();
        }

        // if not started, check to see if we _can_ start
        if (!this.recording) {
            
            // if saveVideo is off, do nothing
            if (!this.feed.saveVideo) {
                return;
            }
            
            // onlySaveMotion is false, so we save everything
            if (this.feed.onlySaveMotion !== true) {
                this.start();

            // onlySaveMotion is true, start if we have motion
            } else if (frame.motionDetected) {
                this.start();

            // onlySaveMotion is true, and there's no motion. do nothing.
            } else {
                return;
            }

        // recorder is started
        // if we're only saving on motion, check to see if we should stop recording
        } else if (this.feed.onlySaveMotion === true && this.motionlessFrames.hasReachedLimit()) {
            this.stop();
            return;
        }


        if (this.recording) {
            this.recording.writeFrame(frame);
        }
    }

    private initTimer() {
        const now = Date.now();
        // the number of mills remaining until midnight, UTC
        const remaining = ONE_DAY_MS - (now % ONE_DAY_MS);
        // since we'd like to break up videos cleanly on the day, 
        // we work back from midnight to figure out how long to wait
        const delay = remaining % this.rotateInterval;

        this.timeout = setTimeout(this.restart, delay);
    }
}
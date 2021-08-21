import { Feed } from 'graba.interface';
import { Frame } from './FFmpegToJpeg';
import { config } from '../background/config';
import { sendSms } from './functional/sendSms';

export class MotionAlertSMS {
    private readonly feed: Feed;

    constructor(feed: Feed) {
        this.feed = feed;
        this.onFrame = this.onFrame.bind(this);
    }

    onFrame(frame: Frame) {
        if (config.enableSMSAlerts !== true) {
            return;
        }

        if (this.feed.alertOnMotion !== true) {
            return;
        }
        
        if (frame.isMotionStart) {
            this.send(frame.buffer);
        }
    }

    private send(image: Buffer) {
        sendSms({
            body: `Motion Alert: ${this.feed.name}`,
            image,
        });
    }
}
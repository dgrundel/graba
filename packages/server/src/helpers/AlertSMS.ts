import { Feed } from 'graba.interface';
import { logger } from './logger';
import { Frame } from './FFmpegToJpeg';
import twilio, { Twilio } from 'twilio';
import { config } from '../background/config';
import { uploadImage } from './cloudinary';

export class AlertSMS {
    private readonly feed: Feed;
    twilioClient: Twilio;

    constructor(feed: Feed) {
        this.feed = feed;
        this.twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
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

    private async send(image: Buffer) {
        if (!config.smsTo) {
            return;
        }

        const base64 = image.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;
        
        // upload image to cloudinary
        const imageUrl = await uploadImage(dataUri);

        // send mms via twilio
        const message = await this.twilioClient.messages.create({
            body: `Motion Alert: ${this.feed.name}`,
            from: config.smsFrom,
            to: config.smsTo,
            mediaUrl: [
                imageUrl
            ],
        });

        logger.info("SMS/MMS sent", {
            uri: message.uri,
            sid: message.sid,
            accountSid: message.accountSid,
            subresourceUris: message.subresourceUris,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
        });
    }
}
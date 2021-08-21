import { Feed } from 'graba.interface';
import { config } from '../background/config';
import { Frame } from './FFmpegToJpeg';
import { sendEmail } from './functional/sendEmail';
import { sendSms } from './functional/sendSms';
import { shortName } from './functional/util';

const IMAGE_CID = 'feed-still-image';

export class MotionAlert {
    private readonly filePrefix: string;
    private readonly alertSubject: string;
    private readonly alertTextBody: string;
    private readonly alertHtmlBody: string;

    constructor(feed: Feed) {
        this.filePrefix = shortName(feed.name)
        this.alertSubject = `Motion Alert: ${feed.name}`;
        this.alertTextBody = `
## Motion Alert

Motion on feed "${feed.name}". See attached image.
        `;
        this.alertHtmlBody = `
<h2>Motion Alert</h2>
<p>Motion on feed <strong>${feed.name}</strong>.</p>

<hr>

<img src="cid:${IMAGE_CID}" style="max-width: 100%"/>
        `;
        
        this.onFrame = this.onFrame.bind(this);
    }

    onFrame(frame: Frame) {
        if (frame.isMotionStart) {
            if (config.enableEmailAlerts === true) {
                this.sendEmailAlert(frame.buffer);
            }

            if (config.enableSMSAlerts === true) {
                this.sendSmsAlert(frame.buffer);
            }
        }
    }

    private sendSmsAlert(image: Buffer) {
        sendSms({
            body: this.alertSubject,
            image,
        });
    }

    private sendEmailAlert(image: Buffer) {
        const filename = this.filePrefix + '_' + new Date().toISOString().replace(/\W+/g, '-') + '.jpg';
        
        sendEmail({
            subject: this.alertSubject,
            text: this.alertTextBody,
            html: this.alertHtmlBody,
            attachments: [{
                cid: IMAGE_CID,
                filename,
                contentType: 'image/jpeg',
                content: image,
            }]
        });
    }
}
import { nanoid } from 'nanoid';
import { Feed } from 'graba.interface';
import { config } from '../background/config';
import { Frame } from './FFmpegToJpeg';
import { sendEmail } from './functional/sendEmail';

const MAX_FILE_NAME_LENGTH = 245; // 255 is the usual max, minus some wiggle room

export class MotionAlertMailer {
    private readonly feed: Feed;

    constructor(feed: Feed) {
        this.feed = feed;
        
        this.onFrame = this.onFrame.bind(this);
    }

    onFrame(frame: Frame) {
        if (config.enableEmailAlerts !== true) {
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
        const cid = nanoid();

        const mailOptions = {
            subject: `Motion Alert: ${this.feed.name}`,
            text: `
## Motion Alert

Motion on feed "${this.feed.name}". See attached image.
`,
            html: `
<h2>Motion Alert</h2>
<p>Motion on feed <strong>${this.feed.name}</strong>.</p>

<hr>

<img src="cid:${cid}" style="max-width: 100%"/>
`,
            attachments: [{
                cid,
                filename: this.generateFileName(),
                contentType: 'image/jpeg',
                content: image,
            }]
        };
        
        sendEmail(mailOptions);
    }

    private generateFileName = () => {
        const suffix = '_' + new Date().toISOString().replace(/\W+/g, '-') + '.jpg';
    
        const maxChars = (MAX_FILE_NAME_LENGTH - suffix.length);
        let nameStr = this.feed.name.replace(/\W+/g, '-').replace(/\-+/, '-');
        if (nameStr.length > maxChars) {
            nameStr = nameStr.slice(0, maxChars);
        }
    
        return nameStr + suffix;
    }
}
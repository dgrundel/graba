import { nanoid } from 'nanoid';
import { createTransport, Transporter } from 'nodemailer';
import { Feed } from 'graba.interface';
import { config } from '../background/config';
import { logger } from './logger';
import { Frame } from './FFmpegToJpeg';

const MAX_FILE_NAME_LENGTH = 245; // 255 is the usual max, minus some wiggle room

export class AlertMailer {
    private readonly feed: Feed;
    private readonly mailTransport: Transporter<any>;

    constructor(feed: Feed) {
        this.feed = feed;
        this.mailTransport = createTransport({
            host: config.smtpServer,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword,
            },
        });

        this.onFrame = this.onFrame.bind(this);
    }

    onFrame(frame: Frame) {
        if (this.feed.alertOnMotion !== true) {
            return;
        }
        
        if (frame.isMotionStart) {
            this.send(frame.buffer);
        }
    }

    private async send(image: Buffer) {
        if (!config.emailTo) {
            logger.error('Cannot send email because no recipient defined.');
            return;
        }
        
        const cid = nanoid();

        const info = await this.mailTransport.sendMail({
            from: config.emailFrom,
            to: config.emailTo,
            subject: `Motion Alert: ${this.feed.name}`,
            text: `
## Motion Alert

Motion on feed "${this.feed.name}". See attached image.
`,
            html: `
<h2>Motion Alert</h2>
<p>Motion on feed <strong>${this.feed.name}</strong>.</p>

<hr>

<img src="cid:${cid}"/>
`,
            attachments: [{
                cid,
                filename: this.generateFileName(),
                contentType: 'image/jpeg',
                content: image,
            }]
        });

        logger.info("Email sent", info);
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
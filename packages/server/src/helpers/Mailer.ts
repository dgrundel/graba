import { nanoid } from 'nanoid';
import { createTransport, Transporter } from 'nodemailer';
import { config } from '../background/config';
import { logger } from './logger';

export class Mailer {
    transport: Transporter<any>;

    constructor() {
        this.transport = createTransport({
            host: config.smtpServer,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword,
            },
        });
    }

    async send(image: Buffer) {
        if (!config.emailTo) {
            logger.error('Cannot send email because no recipient defined.');
            return;
        }
        
        const cid = nanoid();

        const info = await this.transport.sendMail({
            from: config.emailFrom,
            to: config.emailTo,
            subject: "Motion Alert",
            text: "Motion Alert",
            html: `<h1>Motion Alert</h1><img src="cid:${cid}"/>`,
            attachments: [
                {
                    cid,
                    filename: 'still.jpg',
                    contentType: 'image/jpeg',
                    content: image,
                }
            ]
        });

        logger.info("Email sent", info);
    }
}
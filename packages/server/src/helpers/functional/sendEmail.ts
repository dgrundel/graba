import { createTransport } from 'nodemailer';
import { config } from '../../background/config';
import { logger } from './logger';
import { CachingFactory } from '../CachingFactory';
import Mail from 'nodemailer/lib/mailer';

/**
 * Will automatically create a new transport
 * instance if config changes.
 */
const transportFactory = new CachingFactory(
    () => ({
        host: config.smtpServer,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
        },
    }),
    opts => createTransport(opts)
);

export const sendEmail = async (opts: Mail.Options) => {
    const mailOptions = {
        from: config.emailFrom,
        to: config.emailTo,
        ...opts,
    };
    
    if (!mailOptions.to) {
        logger.error('Cannot send email because no recipient defined.');
        return;
    }

    const transport = transportFactory.get();
    const info = await transport.sendMail(mailOptions);

    logger.info("Email sent", info);
};

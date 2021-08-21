import { config } from '../../background/config';
import { logger } from './logger';
import { CachingFactory } from '../CachingFactory';
import twilio from 'twilio';
import { uploadImage } from './cloudinary';

/**
 * Will automatically create a new twilio client
 * instance if config changes.
 */
const twilioClientFactory = new CachingFactory(
    () => [
        config.twilioAccountSid,
        config.twilioAuthToken
    ],
    args => twilio(...args)
);

interface SmsOptions {
    body: string;
    from?: string;
    to?: string;
    image?: Buffer;
    imageMime?: string;
};

export const sendSms = async (smsOptions: SmsOptions) => {
    const twSmsOpts: any = {
        body: smsOptions.body,
        from: smsOptions.from || config.smsFrom,
        to: smsOptions.to || config.smsTo,
    };
    
    if (!twSmsOpts.to) {
        logger.error('Cannot send SMS because no recipient defined.');
        return;
    }

    if (smsOptions.image) {
        const base64 = smsOptions.image.toString('base64');
        const mime = smsOptions.imageMime || 'image/jpeg'
        const dataUri = `data:${mime};base64,${base64}`;
        
        // upload image to cloudinary
        const imageUrl = await uploadImage(dataUri);

        // pass cloudinary URL to Twilio
        twSmsOpts.mediaUrl = [ imageUrl ];
    }

    // send mms via twilio
    const tw = twilioClientFactory.get();
    const result = await tw.messages.create(twSmsOpts);

    logger.info("SMS/MMS sent", {
        uri: result.uri,
        sid: result.sid,
        accountSid: result.accountSid,
        subresourceUris: result.subresourceUris,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
    });
};
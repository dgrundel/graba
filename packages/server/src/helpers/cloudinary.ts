import cloudinary from 'cloudinary';
import { config } from '../background/config';
import { logger } from './logger';

const preconfigure = () => {
    cloudinary.v2.config({
        cloud_name: config.cloudinaryCloudName, 
        api_key: config.cloudinaryApiKey, 
        api_secret: config.cloudinaryApiSecret, 
    });
};

const ONE_MINUTE = 1000 * 60;
const UPLOAD_PUBLIC_TIMEOUT = ONE_MINUTE * 15;

export const uploadImage = (image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        preconfigure();

        const callback: cloudinary.UploadResponseCallback = (err?: cloudinary.UploadApiErrorResponse, result?: cloudinary.UploadApiResponse): void => {
            if (err) {
                logger.error('Error returned from Cloudinary', err);
                reject(err);
                return;
            }

            if (!result) {
                const message = 'No result returned from Cloudinary';
                logger.error(message);
                reject(new Error(message));
                return;
            }

            logger.debug('Cloudinary upload successful', {
                assetId: result.asset_id,
                publicId: result.public_id,
                url: result.url,
                secureUrl: result.secure_url,
            });

            resolve(result.secure_url);
        };

        const options: cloudinary.UploadApiOptions = {
            access_type: "anonymous",
            start: (new Date()).toISOString(),
            end: (new Date(Date.now() + UPLOAD_PUBLIC_TIMEOUT)).toISOString(),
        };

        logger.debug('Uploading image to Cloudinary with options', options);

        cloudinary.v2.uploader.upload(image, options, callback);
    });
};
    
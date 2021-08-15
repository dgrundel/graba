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

export const uploadImage = (image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        preconfigure();

        const callback = (err: cloudinary.UploadApiErrorResponse, result: cloudinary.UploadApiResponse): void => {
            if (err) {
                logger.error('Error returned from Cloudinary', err);
                reject(err);
            }

            logger.debug('Cloudinary upload successful', {
                assetId: result.asset_id,
                publicId: result.public_id,
                url: result.url,
                secureUrl: result.secure_url,
            });

            resolve(result.secure_url);
        };

        cloudinary.v2.uploader.upload(image, callback);
    });
};
    
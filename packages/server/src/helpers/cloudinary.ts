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
const PUBLIC_URL_TIMEOUT = ONE_MINUTE * 15;

export const uploadImage = async (image: string): Promise<string> => {
    preconfigure();
        
    const uploadOptions: cloudinary.UploadApiOptions = {
        type: "private",
    };
    
    logger.debug('Uploading image to Cloudinary with options', uploadOptions);

    const uploadResult = await cloudinary.v2.uploader.upload(image, uploadOptions);

    logger.debug('Cloudinary upload successful', {
        assetId: uploadResult.asset_id,
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
    });

    const expiresTimestampSeconds = (Date.now() + PUBLIC_URL_TIMEOUT) / 1000;

    const url = cloudinary.v2.utils.private_download_url(uploadResult.public_id, uploadResult.format, {
        expires_at: expiresTimestampSeconds,
        resource_type: uploadResult.resource_type,
        attachment: false,
    });

    logger.debug('Private image URL generated: ' + url);

    return url;
};
    
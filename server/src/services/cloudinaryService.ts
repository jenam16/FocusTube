import { v2 as cloudinary } from 'cloudinary';

import { config } from '../config/index.js';



let isConfigured = false;



export const initCloudinary = (): boolean => {

  if (isConfigured) return true;



  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (cloudName && apiKey && apiSecret) {

    cloudinary.config({

      cloud_name: cloudName,

      api_key: apiKey,

      api_secret: apiSecret,

      secure: true,

    });

    isConfigured = true;

    return true;

  }



  return false;

};



export interface UploadScreenshotResult {

  secureUrl: string;

  publicId: string;

}



/**

 * Uploads a base64 encoded screenshot to Cloudinary.

 * If Cloudinary credentials are not configured (e.g. in test or mock environments),

 * returns a safe simulated response or throws descriptive error.

 */

export const uploadScreenshot = async (

  base64Data: string,

  folder: string

): Promise<UploadScreenshotResult> => {

  const configured = initCloudinary();



  if (!configured) {

    // In test or local dev without Cloudinary credentials, log warning and provide structured fallback

    console.warn(

      '[Cloudinary] Credentials not fully configured. Using mock storage url for development/testing.'

    );

    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {

      secureUrl: `https://res.cloudinary.com/demo/image/upload/${folder}/${mockId}.webp`,

      publicId: `${folder}/${mockId}`,

    };

  }



  try {

    const result = await cloudinary.uploader.upload(base64Data, {

      folder,

      resource_type: 'image',

      format: 'webp',

      transformation: [

        { width: 1280, crop: 'limit' },

        { quality: 'auto:good' },

      ],

    });



    return {

      secureUrl: result.secure_url,

      publicId: result.public_id,

    };

  } catch (error: any) {

    console.error('[Cloudinary] Cloud upload encountered error:', error);

    const detail = error?.message ? `: ${error.message}` : '';

    throw new Error(`Failed to upload screenshot to Cloudinary (${error?.http_code || 500})${detail}`);

  }

};



/**

 * Deletes a screenshot asset from Cloudinary by its public ID.

 * Fail-safe: logs any error without rethrowing to avoid breaking database deletion.

 */

export const deleteScreenshot = async (publicId: string): Promise<boolean> => {

  if (!publicId || publicId.startsWith('mock_') || publicId.includes('/mock_')) {

    return true;

  }



  const configured = initCloudinary();

  if (!configured) {

    return true;

  }



  try {

    const result = await cloudinary.uploader.destroy(publicId);

    return result.result === 'ok';

  } catch (error) {

    console.warn(`[Cloudinary] Failed to delete asset ${publicId}:`, error);

    return false;

  }

};


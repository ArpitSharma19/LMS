import cloudinary from '../config/cloudinary.js';

/**
 * Upload a file buffer to Cloudinary.
 * Used everywhere multer memoryStorage is in play — req.file.buffer, not req.file.path.
 */
export const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });

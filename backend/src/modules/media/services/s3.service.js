const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'onlymans-media-bucket';

/**
 * Generate a pre-signed URL for uploading a file
 * @param {string} userId - ID of the user uploading
 * @param {string} contentType - e.g., 'image/jpeg', 'video/mp4'
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
const generateUploadUrl = async (userId, contentType) => {
  const extension = contentType.split('/')[1] || 'bin';
  const key = `uploads/${userId}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { uploadUrl, key };
};

/**
 * Generate a pre-signed URL for viewing a file
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiry time in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
const generateViewUrl = async (key) => {
  if (!key) return null;
  // If the key is already a full http URL (e.g. Cloudinary), optimize and return
  if (key.startsWith('http://') || key.startsWith('https://')) {
    // Inject Cloudinary auto-optimization flags if it's a Cloudinary URL
    if (key.includes('res.cloudinary.com') && !key.includes('f_auto') && !key.includes('q_auto')) {
      return key.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    return key;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL valid for 1 hour by default
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = {
  generateUploadUrl,
  generateViewUrl,
  s3Client
};

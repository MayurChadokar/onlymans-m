const fs = require('fs');
const path = require('path');
const { cloudinary, tempUploadDir } = require('../services/cloudinary.service');

const uploadChunk = async (req, res, next) => {
  try {
    const { uploadId, chunkIndex, totalChunks } = req.body;
    const chunkFile = req.file;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !chunkFile) {
      return res.status(400).send({ message: 'Missing chunk upload parameters' });
    }

    const tempFilePath = path.join(tempUploadDir, `${uploadId}-merged`);
    
    // Append the chunk to the merged file
    const chunkData = fs.readFileSync(chunkFile.path);
    fs.appendFileSync(tempFilePath, chunkData);

    // Delete the individual chunk file to save space
    fs.unlinkSync(chunkFile.path);

    // If this is the last chunk, upload to Cloudinary
    console.log(`Chunk received: index ${chunkIndex}, total ${totalChunks}`);
    if (parseInt(chunkIndex, 10) === parseInt(totalChunks, 10) - 1) {
      console.log('Last chunk received, uploading to Cloudinary...');
      try {
        const result = await cloudinary.uploader.upload_large(tempFilePath, {
          resource_type: 'video',
          folder: 'onlymans_uploads',
          chunk_size: 6000000,
        });
        console.log('Cloudinary upload result:', JSON.stringify(result));

        if (!result || !result.secure_url) {
          throw new Error(`Cloudinary did not return a secure_url. Result: ${JSON.stringify(result)}`);
        }

        // Cleanup merged file
        fs.unlinkSync(tempFilePath);

        return res.status(200).json({
          url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type,
          completed: true
        });
      } catch (uploadError) {
        console.error('Cloudinary chunked upload error:', uploadError.message);
        // Cleanup merged file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        return res.status(500).json({ message: `Failed to upload video to Cloudinary: ${uploadError.message}` });
      }
    }

    // Acknowledge chunk received
    return res.status(200).json({ message: `Chunk ${chunkIndex} received`, completed: false });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadChunk
};

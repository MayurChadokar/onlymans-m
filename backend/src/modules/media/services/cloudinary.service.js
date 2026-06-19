const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fs = require('fs');
const path = require('path');

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onlymans_uploads',
    resource_type: 'auto', // Automatically detect if it's image or video
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Configure local storage for chunk uploads
const tempUploadDir = path.join(__dirname, '../../../../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    // Save chunk temporarily with uploadId
    const uploadId = req.body.uploadId || 'temp';
    cb(null, `${uploadId}-${req.body.chunkIndex || 0}`);
  }
});

const localUpload = multer({ storage: localStorage });

module.exports = {
  cloudinary,
  upload,
  localUpload,
  tempUploadDir
};

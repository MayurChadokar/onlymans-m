const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Multer-storage-cloudinary automatically attaches path (secure_url) to req.file
    const secureUrl = req.file.path;
    const key = req.file.filename;

    res.json({ url: secureUrl, key });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia
};

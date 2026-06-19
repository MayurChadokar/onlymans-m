const videoService = require('../services/video.service');

const getVideo = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const details = await videoService.getVideoDetails(req.user.id, postId);
    res.json({ video: details });
  } catch (error) {
    next(error);
  }
};

const streamVideo = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await videoService.getVideoStreamUrl(req.user.id, postId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVideo,
  streamVideo
};

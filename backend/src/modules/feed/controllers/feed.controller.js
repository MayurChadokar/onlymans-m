const feedService = require('../services/feed.service');

const getRandomFeed = async (req, res, next) => {
  try {
    const feed = await feedService.getRandomFeed(req.user.id);
    res.json(feed);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRandomFeed,
};

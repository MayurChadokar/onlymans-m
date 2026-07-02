const feedService = require('../services/feed.service');

const getRandomFeed = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bust = req.query.bust === 'true';
    const feed = await feedService.getRandomFeed(req.user.id, limit, bust);
    res.json(feed);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRandomFeed,
};

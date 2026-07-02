const followService = require('../services/follow.service');
const { notificationService } = require('../../notifications');

const toggleFollow = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user.id;
    const result = await followService.toggleFollow(userId, creatorId);
    
    if (result.isFollowing) {
      await notificationService.createAndSendNotification(
        creatorId,
        'NEW_SUBSCRIPTION',
        'New Follower',
        `${req.user.username || 'Someone'} started following you.`,
        `/creator/${req.user.id}`
      );
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const followingIds = await followService.getFollowingIds(req.user.id);
    res.json({ followingIds });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFollow,
  getFollowing
};

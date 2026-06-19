const creatorService = require('../services/creator.service');

const becomeCreator = async (req, res, next) => {
  try {
    const profile = await creatorService.becomeCreator(req.user.id, req.body);
    res.status(201).json({ message: 'Successfully became a creator. Please log in again to refresh your role.', profile });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await creatorService.updateCreatorProfile(req.user.id, req.body);
    res.json({ profile });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await creatorService.getCreatorDashboard(req.user.id);
    res.json(dashboardData);
  } catch (error) {
    error.statusCode = 403;
    next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const profile = await creatorService.getPublicCreatorProfile(creatorId);
    res.json({ profile });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

const browseCreators = async (req, res, next) => {
  try {
    const { search, category, limit, offset } = req.query;
    const creators = await creatorService.searchCreators({ search, category, limit, offset });
    res.json({ creators });
  } catch (error) {
    next(error);
  }
};

const getSecureProfile = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const profileData = await creatorService.getSecureProfile(req.user.id, creatorId);
    res.json(profileData);
  } catch (error) {
    next(error);
  }
};

const getCreatorComments = async (req, res, next) => {
  try {
    const comments = await creatorService.getCreatorComments(req.user.id);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

const deleteCreatorComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    await creatorService.deleteCreatorComment(req.user.id, commentId);
    res.json({ message: 'Comment successfully deleted/moderated by creator' });
  } catch (error) {
    next(error);
  }
};

const getTiers = async (req, res, next) => {
  try {
    const tiers = await creatorService.getCreatorTiers(req.user.id);
    res.json({ tiers });
  } catch (error) {
    next(error);
  }
};

const createTier = async (req, res, next) => {
  try {
    const tier = await creatorService.createCreatorTier(req.user.id, req.body);
    res.status(201).json({ tier });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const deleteTier = async (req, res, next) => {
  try {
    const { tierId } = req.params;
    await creatorService.deleteCreatorTier(req.user.id, tierId);
    res.status(204).send();
  } catch (error) {
    error.statusCode = error.message === 'Unauthorized' ? 403 : 404;
    next(error);
  }
};

module.exports = {
  becomeCreator,
  updateProfile,
  getDashboard,
  getPublicProfile,
  browseCreators,
  getSecureProfile,
  getCreatorComments,
  deleteCreatorComment,
  getTiers,
  createTier,
  deleteTier,
};

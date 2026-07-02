const userService = require('../services/user.service');
const postService = require('../../posts/services/post.service');
const { notificationService } = require('../../notifications');
const { prisma } = require('../../../config/database');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.json({ user });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ user });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const avatarUrl = req.file.path; // Cloudinary assigns the URL to req.file.path
    const user = await userService.updateAvatar(req.user.id, avatarUrl);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await userService.getUserSubscriptions(req.user.id);
    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await userService.getUserDashboard(req.user.id);
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    await userService.cancelUserSubscription(req.user.id, subscriptionId);
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

const deactivateAccount = async (req, res, next) => {
  try {
    await userService.deactivateUserAccount(req.user.id);
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await userService.getPaymentMethods(req.user.id);
    res.json({ paymentMethods: methods });
  } catch (error) {
    next(error);
  }
};

const addPaymentMethod = async (req, res, next) => {
  try {
    const newMethod = await userService.addPaymentMethod(req.user.id, req.body);
    res.status(201).json({ paymentMethod: newMethod });
  } catch (error) {
    next(error);
  }
};

const removePaymentMethod = async (req, res, next) => {
  try {
    const { methodId } = req.params;
    await userService.removePaymentMethod(req.user.id, methodId);
    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await postService.getUserFavorites(req.user.id);
    res.json({ favorites });
  } catch (error) {
    next(error);
  }
};

const reportUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, reason } = req.body;
    const report = await userService.reportUser(req.user.id, userId, type, reason);
    
    res.status(201).json({ message: 'Report submitted successfully', report });

    // Fire-and-forget: notify admins after response is sent
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      .then(admins =>
        Promise.all(admins.map(admin =>
          notificationService.createAndSendNotification(
            admin.id,
            'NEW_REPORT',
            'New Report Filed',
            `A user reported another user for ${type}.`,
            `/admin/reports`
          )
        ))
      ).catch(() => {});
  } catch (error) {
    if (error.message === 'You cannot report yourself') {
      error.statusCode = 400;
    }
    next(error);
  }
};

const subscribeToCreator = async (req, res, next) => {
  try {
    const { creatorId } = req.body;
    if (!creatorId) {
      return res.status(400).json({ error: 'creatorId is required' });
    }
    
    const subscription = await userService.subscribeToCreator(req.user.id, creatorId);
    
    // Notify creator
    await notificationService.createAndSendNotification(
      creatorId,
      'NEW_SUBSCRIPTION',
      'New Subscriber!',
      `Someone just subscribed to your profile.`,
      `/creator/subscribers`
    );
    
    res.status(201).json({ message: 'Subscribed successfully', subscription });
  } catch (error) {
    if (error.message === 'You cannot subscribe to yourself' || error.message === 'You are already subscribed to this creator') {
      error.statusCode = 400;
    }
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMySubscriptions,
  getDashboard,
  cancelSubscription,
  deactivateAccount,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getFavorites,
  updateAvatar,
  reportUser,
  subscribeToCreator,
};

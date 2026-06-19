const userService = require('../services/user.service');
const postService = require('../../posts/services/post.service');

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
  getFavorites
};

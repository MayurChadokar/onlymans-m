const notificationService = require('../services/notification.service');

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await notificationService.getUserNotifications(req.user.id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const saveFcmToken = async (req, res, next) => {
  try {
    const { token, device } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    await notificationService.saveFcmToken(req.user.id, token, device);
    res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  saveFcmToken,
};

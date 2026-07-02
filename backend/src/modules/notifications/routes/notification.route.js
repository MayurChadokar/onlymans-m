const express = require('express');
const authenticate = require('../../auth/middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/fcm-token', notificationController.saveFcmToken);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;

const { prisma } = require('../../../config/database');
const { getApps } = require('./firebase.service');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Creates a notification in the database and attempts to send a push notification via Firebase.
 * @param {string} userId - ID of the user receiving the notification
 * @param {string} type - NotificationType enum
 * @param {string} title - Title of the notification
 * @param {string} message - Body of the notification
 * @param {string} [linkUrl] - URL to navigate to when clicked
 */
const createAndSendNotification = async (userId, type, title, message, linkUrl = null) => {
  try {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
      },
    });

    // 2. Fetch FCM Tokens for the user
    const userTokens = await prisma.fcmToken.findMany({
      where: { userId },
    });

    const tokens = userTokens.map((t) => t.token);

    // 3. Send Push Notification if tokens exist
    if (tokens.length > 0 && getApps().length > 0) {
      const payload = {
        notification: {
          title,
          body: message,
        },
        data: {
          linkUrl: linkUrl || '',
          notificationId: notification.id,
        },
        tokens,
      };

      try {
        const messaging = getMessaging();
        const response = await messaging.sendEachForMulticast(payload);
        
        // Remove invalid tokens
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });
          
          if (failedTokens.length > 0) {
            await prisma.fcmToken.deleteMany({
              where: { token: { in: failedTokens } },
            });
          }
        }
      } catch (fcmError) {
        console.error('Error sending FCM notification:', fcmError);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {string} userId 
 * @param {number} page 
 * @param {number} limit 
 */
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  };
};

/**
 * Mark notification as read
 * @param {string} notificationId 
 * @param {string} userId 
 */
const markAsRead = async (notificationId, userId) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications as read
 * @param {string} userId 
 */
const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

/**
 * Save FCM token
 * @param {string} userId 
 * @param {string} token 
 * @param {string} device 
 */
const saveFcmToken = async (userId, token, device = null) => {
  return prisma.fcmToken.upsert({
    where: { token },
    update: { userId, device, updatedAt: new Date() },
    create: { userId, token, device },
  });
};

module.exports = {
  createAndSendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  saveFcmToken,
};

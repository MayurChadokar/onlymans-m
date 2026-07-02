const userRepository = require('../repositories/user.repository');
const cache = require('../../../cache/cache.service');
const config = require('../../../config/env');

const USERS_TTL = config.cache.usersListTTL;
const DASHBOARD_TTL = config.cache.dashboardTTL;

const getUserProfile = async (userId) => {
  return cache.wrap(`user:profile:${userId}`, USERS_TTL, async () => {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });
};

const updateUserProfile = async (userId, updateData) => {
  if (updateData.email) {
    // Check if email is taken logic could be added here
  }
  const updated = await userRepository.updateUserById(userId, updateData);
  await cache.del(`user:profile:${userId}`);
  await cache.del(`user:dashboard:${userId}`);
  return updated;
};

const updateAvatar = async (userId, avatarUrl) => {
  const updated = await userRepository.updateUserById(userId, { avatarUrl });
  await cache.del(`user:profile:${userId}`);
  await cache.del(`user:dashboard:${userId}`);
  return updated;
};

const getUserSubscriptions = async (userId) => {
  return cache.wrap(`user:subscriptions:${userId}`, USERS_TTL, async () => {
    const subscriptions = await userRepository.findAllUserSubscriptions(userId);

    return subscriptions.map(sub => {
      const formattedStatus = sub.status === 'ACTIVE' ? 'Active' : 'Canceled';
      const formattedDate = new Date(sub.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return {
        id: sub.id,
        creatorUsername: sub.creator.username,
        status: formattedStatus,
        renewDate: sub.status === 'ACTIVE' ? formattedDate : `Ends ${formattedDate}`,
        amount: `$${sub.creator.creatorProfile?.price || 0}/mo`,
        creator: {
          id: sub.creator.id,
          username: sub.creator.username,
          bio: sub.creator.creatorProfile?.bio || '',
          price: sub.creator.creatorProfile?.price || 0,
          avatarUrl: sub.creator.creatorProfile?.avatarUrl || null
        }
      };
    });
  });
};

const cancelUserSubscription = async (userId, subscriptionId) => {
  const result = await userRepository.cancelSubscription(subscriptionId, userId);
  await cache.del(`user:subscriptions:${userId}`);
  await cache.del(`user:dashboard:${userId}`);
  return result;
};

const getUserDashboard = async (userId) => {
  return cache.wrap(`user:dashboard:${userId}`, DASHBOARD_TTL, async () => {
    // Run independent queries in parallel — user info and subscriptions don't depend on each other
    const [user, subscriptions] = await Promise.all([
      userRepository.findUserById(userId),
      userRepository.findUserSubscriptions(userId),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const activeSubscriptions = subscriptions.map(sub => ({
      subscriptionId: sub.id,
      startDate: sub.startDate,
      endDate: sub.endDate,
      creator: {
        id: sub.creator.id,
        username: sub.creator.username,
        bio: sub.creator.creatorProfile?.bio || '',
        price: sub.creator.creatorProfile?.price || 0,
        avatarUrl: sub.creator.creatorProfile?.avatarUrl || null,
        coverUrl: sub.creator.creatorProfile?.coverUrl || null
      }
    }));

    const activeSubscriptionsCount = activeSubscriptions.length;
    const totalSpentEstimates = activeSubscriptions.reduce((acc, sub) => acc + sub.creator.price, 0);

    const subscribedCreatorIds = activeSubscriptions.map(sub => sub.creator.id);

    // recentPosts and suggestions both need subscribedCreatorIds but are independent of each other
    const [recentPosts, suggestions] = await Promise.all([
      userRepository.findRecentSubscribedPosts(subscribedCreatorIds, 5),
      userRepository.findSuggestedCreators(userId, subscribedCreatorIds, 5),
    ]);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      stats: {
        activeSubscriptionsCount,
        totalSpentEstimates
      },
      activeSubscriptions,
      recentPosts,
      suggestedCreators: suggestions.map(s => ({
        id: s.id,
        username: s.username,
        bio: s.creatorProfile?.bio || '',
        price: s.creatorProfile?.price || 0,
        avatarUrl: s.creatorProfile?.avatarUrl || null,
        coverUrl: s.creatorProfile?.coverUrl || null
      }))
    };
  });
};

let mockUserPaymentMethods = {};

const deactivateUserAccount = async (userId) => {
  return userRepository.deactivateUser(userId);
};

const getPaymentMethods = async (userId) => {
  if (!mockUserPaymentMethods[userId]) {
    mockUserPaymentMethods[userId] = [
      { id: 'pm_1', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028 }
    ];
  }
  return mockUserPaymentMethods[userId];
};

const addPaymentMethod = async (userId, data) => {
  const newMethod = {
    id: `pm_${Date.now()}`,
    brand: data.brand || 'Visa',
    last4: data.last4 || '1111',
    expMonth: parseInt(data.expMonth) || 12,
    expYear: parseInt(data.expYear) || 2029
  };
  if (!mockUserPaymentMethods[userId]) {
    mockUserPaymentMethods[userId] = [];
  }
  mockUserPaymentMethods[userId].push(newMethod);
  return newMethod;
};

const removePaymentMethod = async (userId, methodId) => {
  if (mockUserPaymentMethods[userId]) {
    mockUserPaymentMethods[userId] = mockUserPaymentMethods[userId].filter(m => m.id !== methodId);
  }
  return true;
};

const reportUser = async (reportedById, reportedUserId, type, reason) => {
  if (reportedById === reportedUserId) {
    throw new Error('You cannot report yourself');
  }
  return userRepository.createReport(reportedById, reportedUserId, type, reason);
};

const subscribeToCreator = async (subscriberId, creatorId) => {
  if (subscriberId === creatorId) {
    throw new Error('You cannot subscribe to yourself');
  }
  
  try {
    const subscription = await userRepository.createSubscription(subscriberId, creatorId);
    
    await cache.del(`user:subscriptions:${subscriberId}`);
    await cache.del(`user:dashboard:${subscriberId}`);
    
    return subscription;
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error('You are already subscribed to this creator');
    }
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserSubscriptions,
  getUserDashboard,
  cancelUserSubscription,
  deactivateUserAccount,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  updateAvatar,
  reportUser,
  subscribeToCreator,
};

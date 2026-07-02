const { prisma } = require('../../../config/database');

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isVerified: true,
      createdAt: true,
    }
  });
};

const updateUserById = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isVerified: true,
      createdAt: true,
    }
  });
};

const findUserSubscriptions = async (userId) => {
  return prisma.subscription.findMany({
    where: { 
      subscriberId: userId,
      status: 'ACTIVE'
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          creatorProfile: true
        }
      }
    }
  });
};

const findRecentSubscribedPosts = async (creatorIds, limit = 5) => {
  if (creatorIds.length === 0) return [];
  return prisma.post.findMany({
    where: {
      creatorId: { in: creatorIds }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    include: {
      media: true,
      creator: {
        select: {
          id: true,
          username: true,
          creatorProfile: {
            select: {
              avatarUrl: true
            }
          }
        }
      }
    }
  });
};

const findSuggestedCreators = async (userId, excludeCreatorIds, limit = 5) => {
  return prisma.user.findMany({
    where: {
      role: 'CREATOR',
      id: {
        notIn: [userId, ...excludeCreatorIds]
      },
      creatorProfile: {
        isNot: null
      }
    },
    take: limit,
    select: {
      id: true,
      username: true,
      creatorProfile: {
        select: {
          bio: true,
          price: true,
          avatarUrl: true,
          coverUrl: true
        }
      }
    }
  });
};

const findAllUserSubscriptions = async (userId) => {
  return prisma.subscription.findMany({
    where: { 
      subscriberId: userId
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          creatorProfile: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
};

const cancelSubscription = async (subscriptionId, subscriberId) => {
  return prisma.subscription.update({
    where: {
      id: subscriptionId,
      subscriberId
    },
    data: {
      status: 'CANCELLED'
    }
  });
};

const deactivateUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data: { isActive: false }
  });
};

const createReport = async (reportedById, reportedUserId, type, reason) => {
  return prisma.report.create({
    data: {
      reportedById,
      reportedUserId,
      type,
      reason,
      status: 'PENDING'
    }
  });
};

const createSubscription = async (subscriberId, creatorId) => {
  // 30 days from now
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  return prisma.subscription.create({
    data: {
      subscriberId,
      creatorId,
      status: 'ACTIVE',
      endDate
    }
  });
};

module.exports = {
  findUserById,
  updateUserById,
  findUserSubscriptions,
  findRecentSubscribedPosts,
  findSuggestedCreators,
  findAllUserSubscriptions,
  cancelSubscription,
  deactivateUser,
  createReport,
  createSubscription,
};

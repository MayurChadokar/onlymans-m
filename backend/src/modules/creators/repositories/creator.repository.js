const { prisma } = require('../../../config/database');

const createProfile = async (userId, data) => {
  return prisma.creatorProfile.create({
    data: {
      userId,
      ...data
    }
  });
};

const updateProfile = async (userId, data) => {
  return prisma.creatorProfile.update({
    where: { userId },
    data
  });
};

const getProfileByUserId = async (userId) => {
  return prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { username: true, email: true, createdAt: true }
      }
    }
  });
};

const getCreatorSubscribers = async (creatorId) => {
  return prisma.subscription.findMany({
    where: {
      creatorId,
      status: 'ACTIVE'
    },
    include: {
      subscriber: {
        select: { id: true, username: true }
      }
    }
  });
};

const upgradeUserRole = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role: 'CREATOR' }
  });
};

const findCreators = async ({ search, category, limit = 10, offset = 0 }) => {
  const where = {
    role: 'CREATOR',
    creatorProfile: {
      isNot: null
    }
  };

  const andConditions = [];

  if (search) {
    andConditions.push({
      OR: [
        {
          username: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          creatorProfile: {
            bio: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    });
  }

  if (category && category !== 'All') {
    const categoryKeywords = {
      fitness: ['fitness', 'trainer', 'nutrition', 'gym', 'workout', 'diet', 'coach', 'fit'],
      lifestyle: ['lifestyle', 'travel', 'fashion', 'vlog', 'luxury', 'curator'],
      gaming: ['gaming', 'gamer', 'play', 'twitch', 'esports', 'streamer'],
      vlogs: ['vlogs', 'vlogger', 'daily', 'lifestyle', 'life'],
      music: ['music', 'song', 'singer', 'band', 'producer', 'instrument', 'guitar', 'piano']
    };

    const keywords = categoryKeywords[category.toLowerCase()] || [category.toLowerCase()];
    andConditions.push({
      OR: keywords.map(keyword => ({
        creatorProfile: {
          bio: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      }))
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return prisma.user.findMany({
    where,
    skip: parseInt(offset) || 0,
    take: parseInt(limit) || 10,
    select: {
      id: true,
      username: true,
      creatorProfile: {
        select: {
          bio: true,
          price: true,
          avatarUrl: true,
          coverUrl: true,
          createdAt: true
        }
      }
    }
  });
};

const checkUserSubscription = async (subscriberId, creatorId) => {
  return prisma.subscription.findFirst({
    where: {
      subscriberId,
      creatorId,
      status: 'ACTIVE'
    }
  });
};

const getCreatorPosts = async (creatorId) => {
  return prisma.post.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    include: {
      media: true,
      _count: {
        select: { likes: true }
      }
    }
  });
};

const getCommentsByCreatorId = async (creatorId) => {
  return prisma.comment.findMany({
    where: {
      post: {
        creatorId
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      },
      post: {
        select: {
          id: true,
          content: true
        }
      }
    }
  });
};

const findCommentById = async (commentId) => {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      post: true
    }
  });
};

const deleteComment = async (commentId) => {
  return prisma.comment.delete({
    where: { id: commentId }
  });
};

const createTier = async (creatorId, data) => {
  return prisma.subscriptionTier.create({
    data: { creatorId, ...data },
  });
};

const getTiersByCreatorId = async (creatorId) => {
  return prisma.subscriptionTier.findMany({
    where: { creatorId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
};

const findTierById = async (tierId) => {
  return prisma.subscriptionTier.findUnique({ where: { id: tierId } });
};

const deleteTier = async (tierId) => {
  return prisma.subscriptionTier.delete({ where: { id: tierId } });
};

module.exports = {
  createProfile,
  updateProfile,
  getProfileByUserId,
  getCreatorSubscribers,
  upgradeUserRole,
  findCreators,
  checkUserSubscription,
  getCreatorPosts,
  getCommentsByCreatorId,
  findCommentById,
  deleteComment,
  createTier,
  getTiersByCreatorId,
  findTierById,
  deleteTier,
};

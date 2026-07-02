const creatorRepository = require('../repositories/creator.repository');
const postRepository = require('../../posts/repositories/post.repository');
const cache = require('../../../cache/cache.service');
const config = require('../../../config/env');

const CREATOR_TTL = config.cache.creatorsListTTL;
const DASHBOARD_TTL = config.cache.dashboardTTL;

const becomeCreator = async (userId, profileData) => {
  const existingProfile = await creatorRepository.getProfileByUserId(userId);
  if (existingProfile) {
    throw new Error('User is already a creator');
  }

  const profile = await creatorRepository.createProfile(userId, profileData);
  await creatorRepository.upgradeUserRole(userId);
  return profile;
};

const updateCreatorProfile = async (userId, updateData) => {
  const profile = await creatorRepository.getProfileByUserId(userId);
  if (!profile) {
    throw new Error('Creator profile not found');
  }

  const updated = await creatorRepository.updateProfile(userId, updateData);
  // Delete specific keys instead of slow SCAN pattern
  await Promise.all([
    cache.del(`creator:public:${userId}`),
    cache.del(`creator:dashboard:${userId}`),
    cache.del(`creator:tiers:${userId}`),
    cache.del(`creator:comments:${userId}`),
    cache.delPattern(`creator:secure:${userId}:*`),
    cache.delPattern(`creator:secure:*:${userId}`),
  ]);
  return updated;
};

const getPublicCreatorProfile = async (creatorId) => {
  return cache.wrap(`creator:public:${creatorId}`, CREATOR_TTL, async () => {
    const profile = await creatorRepository.getProfileByUserId(creatorId);
    if (!profile) {
      const user = await creatorRepository.getUserById(creatorId);
      if (!user) {
        throw new Error('Creator not found');
      }
      return {
        id: user.id,
        username: user.username,
        bio: 'Fan member',
        price: 0.0,
        avatarUrl: user.avatarUrl,
        coverUrl: null,
        joinedAt: user.createdAt,
        tiers: []
      };
    }

    const tiers = await creatorRepository.getTiersByCreatorId(creatorId);

    return {
      id: profile.userId,
      username: profile.user.username,
      bio: profile.bio,
      price: profile.price,
      avatarUrl: profile.avatarUrl,
      coverUrl: profile.coverUrl,
      joinedAt: profile.createdAt,
      tiers
    };
  });
};

const getCreatorDashboard = async (creatorId) => {
  return cache.wrap(`creator:dashboard:${creatorId}`, DASHBOARD_TTL, async () => {
    let profile = await creatorRepository.getProfileByUserId(creatorId);

    // Graceful recovery: user has CREATOR role but no profile record yet
    if (!profile) {
      profile = await creatorRepository.createProfile(creatorId, {
        bio: null,
        price: 0,
        avatarUrl: null,
        coverUrl: null,
      });
      profile = await creatorRepository.getProfileByUserId(creatorId);
    }

    if (!profile) {
      const err = new Error('Creator profile could not be initialized');
      err.statusCode = 500;
      throw err;
    }

    const [activeSubscriptions, posts] = await Promise.all([
      creatorRepository.getCreatorSubscribers(creatorId),
      postRepository.getPostsByCreatorId(creatorId),
    ]);

    const subscribers = activeSubscriptions.map(sub => ({
      subscriptionId: sub.id,
      subscriberId: sub.subscriber.id,
      username: sub.subscriber.username,
      startDate: sub.startDate,
      endDate: sub.endDate
    }));

    const totalLikes = posts.reduce((acc, post) => acc + (post._count?.likes || 0), 0);

    return {
      profile: {
        bio: profile.bio,
        price: profile.price,
        username: profile.user.username,
        avatarUrl: profile.avatarUrl,
        coverUrl: profile.coverUrl
      },
      stats: {
        totalSubscribers: subscribers.length,
        monthlyRevenueEstimate: subscribers.length * profile.price,
        totalPosts: posts.length,
        totalLikes
      },
      subscribers,
      posts
    };
  });
};

const searchCreators = async (filters) => {
  const cacheKey = `creators:search:${JSON.stringify(filters)}`;
  return cache.wrap(cacheKey, CREATOR_TTL, () => creatorRepository.findCreators(filters));
};

const getSecureProfile = async (viewerId, creatorId) => {
  return cache.wrap(`creator:secure:${creatorId}:${viewerId}`, 60, async () => {
    const creator = await creatorRepository.getProfileByUserId(creatorId);
    if (!creator) {
      const user = await creatorRepository.getUserById(creatorId);
      if (!user) {
        throw new Error('Creator profile not found');
      }
      return {
        profile: {
          id: user.id,
          username: user.username,
          bio: 'Fan member',
          price: 0,
          avatarUrl: user.avatarUrl,
          coverUrl: null,
          createdAt: user.createdAt
        },
        isSubscribed: false,
        stats: {
          fansCount: 0,
          postsCount: 0,
          likesCount: 0
        },
        posts: [],
        tiers: []
      };
    }

    const isSelf = viewerId === creatorId;
    const [sub, rawPosts, subscribers, tiers] = await Promise.all([
      creatorRepository.checkUserSubscription(viewerId, creatorId),
      creatorRepository.getCreatorPosts(creatorId),
      creatorRepository.getCreatorSubscribers(creatorId),
      creatorRepository.getTiersByCreatorId(creatorId),
    ]);
    const isSubscribed = isSelf || !!sub;

    const posts = rawPosts.map(post => {
      const isPremium = post.visibility === 'PREMIUM';
      const showLocked = isPremium && !isSubscribed;

      return {
        id: post.id,
        creatorId: post.creatorId,
        content: post.content,
        visibility: post.visibility,
        commentsEnabled: post.commentsEnabled,
        createdAt: post.createdAt,
        isLocked: showLocked,
        likesCount: post._count?.likes || 0,
        media: post.media.map(item => ({
          id: item.id,
          type: item.type,
          url: showLocked
            ? 'https://picsum.photos/seed/onlymans-locked/400/400?blur=10'
            : item.url,
          createdAt: item.createdAt
        }))
      };
    });

    const totalFans = subscribers.length;
    const totalLikes = rawPosts.reduce((acc, post) => acc + (post._count?.likes || 0), 0);

    return {
      profile: {
        id: creator.userId,
        username: creator.user.username,
        bio: creator.bio,
        price: creator.price,
        avatarUrl: creator.avatarUrl,
        coverUrl: creator.coverUrl,
        createdAt: creator.createdAt
      },
      isSubscribed,
      stats: {
        fansCount: totalFans,
        postsCount: rawPosts.length,
        likesCount: totalLikes
      },
      posts,
      tiers
    };
  });
};

const getCreatorComments = async (creatorId) => {
  const profile = await creatorRepository.getProfileByUserId(creatorId);
  if (!profile) {
    throw new Error('Not a creator');
  }
  return cache.wrap(`creator:comments:${creatorId}`, 60, () =>
    creatorRepository.getCommentsByCreatorId(creatorId)
  );
};

const deleteCreatorComment = async (creatorId, commentId) => {
  const profile = await creatorRepository.getProfileByUserId(creatorId);
  if (!profile) {
    throw new Error('Not a creator');
  }

  const comment = await creatorRepository.findCommentById(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.post.creatorId !== creatorId) {
    throw new Error('Unauthorized to moderate this comment');
  }

  const result = await creatorRepository.deleteComment(commentId);
  await cache.del(`creator:comments:${creatorId}`);
  return result;
};

const getCreatorTiers = async (creatorId) => {
  return cache.wrap(`creator:tiers:${creatorId}`, CREATOR_TTL, () =>
    creatorRepository.getTiersByCreatorId(creatorId)
  );
};

const createCreatorTier = async (creatorId, data) => {
  const profile = await creatorRepository.getProfileByUserId(creatorId);
  if (!profile) throw new Error('Not a creator');
  const tier = await creatorRepository.createTier(creatorId, data);
  await cache.del(`creator:tiers:${creatorId}`);
  return tier;
};

const deleteCreatorTier = async (creatorId, tierId) => {
  const tier = await creatorRepository.findTierById(tierId);
  if (!tier) throw new Error('Tier not found');
  if (tier.creatorId !== creatorId) throw new Error('Unauthorized');
  const result = await creatorRepository.deleteTier(tierId);
  await cache.del(`creator:tiers:${creatorId}`);
  return result;
};

module.exports = {
  becomeCreator,
  updateCreatorProfile,
  getPublicCreatorProfile,
  getCreatorDashboard,
  searchCreators,
  getSecureProfile,
  getCreatorComments,
  deleteCreatorComment,
  getCreatorTiers,
  createCreatorTier,
  deleteCreatorTier,
};

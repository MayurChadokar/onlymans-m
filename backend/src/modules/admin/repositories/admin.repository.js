const { prisma } = require('../../../config/database');

// ==================== DASHBOARD ====================

/**
 * Get aggregated dashboard statistics
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCreators,
    verifiedCreators,
    activeSubscriptions,
    pendingReports,
    totalComments,
    totalPosts,
    blockedUsers,
    revenueResult,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'CREATOR' } }),
    prisma.user.count({ where: { role: 'CREATOR', isVerified: true } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.comment.count(),
    prisma.post.count(),
    prisma.user.count({ where: { isActive: false } }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { creator: { select: { creatorProfile: { select: { price: true } } } } },
    }),
  ]);

  const monthlyRevenue = revenueResult.reduce((sum, sub) => {
    return sum + (sub.creator?.creatorProfile?.price || 0);
  }, 0);

  return {
    totalUsers,
    totalCreators,
    verifiedCreators,
    activeSubscriptions,
    pendingReports,
    totalComments,
    totalPosts,
    blockedUsers,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
  };
};

// ==================== USERS ====================

/**
 * Get paginated users with filters
 */
const getUsers = async ({ page = 1, limit = 20, role, status, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (role) where.role = role;
  if (status === 'ACTIVE') where.isActive = true;
  if (status === 'BLOCKED') where.isActive = false;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creatorProfile: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            subscriptions: true,
            subscribers: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single user by ID with full details
 */
const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      creatorProfile: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          subscriptions: true,
          subscribers: true,
          reportsReceived: true,
          reportsFiled: true,
        },
      },
    },
  });
};

/**
 * Update user by ID
 */
const updateUserById = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    include: {
      creatorProfile: true,
    },
  });
};

/**
 * Hard delete user and all related data (cascades via schema)
 */
const deleteUserById = async (id) => {
  return prisma.user.delete({
    where: { id },
  });
};

// ==================== POSTS ====================

/**
 * Get paginated posts with filters
 */
const getPosts = async ({ page = 1, limit = 20, visibility, creatorId, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (visibility) where.visibility = visibility;
  if (creatorId) where.creatorId = creatorId;
  if (search) {
    where.content = { contains: search, mode: 'insensitive' };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true, isVerified: true },
        },
        media: true,
        _count: {
          select: { likes: true, comments: true, bookmarks: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single post by ID with full details
 */
const getPostById = async (id) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, username: true, isVerified: true, email: true },
      },
      media: true,
      _count: {
        select: { likes: true, comments: true, bookmarks: true },
      },
    },
  });
};

/**
 * Update post by ID
 */
const updatePostById = async (id, data) => {
  return prisma.post.update({
    where: { id },
    data,
    include: {
      creator: {
        select: { id: true, username: true, isVerified: true },
      },
      media: true,
      _count: {
        select: { likes: true, comments: true, bookmarks: true },
      },
    },
  });
};

/**
 * Get post media keys before deletion (for S3 cleanup)
 */
const getPostMediaKeys = async (postId) => {
  const media = await prisma.media.findMany({
    where: { postId },
    select: { url: true },
  });
  return media.map(m => m.url);
};

/**
 * Hard delete post (cascades comments, likes, bookmarks, media)
 */
const deletePostById = async (id) => {
  return prisma.post.delete({
    where: { id },
  });
};

// ==================== COMMENTS ====================

/**
 * Get paginated comments with filters
 */
const getComments = async ({ page = 1, limit = 20, postId, userId }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (postId) where.postId = postId;
  if (userId) where.userId = userId;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, isActive: true },
        },
        post: {
          select: { id: true, content: true, creatorId: true },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get comment by ID (to find author for blocking)
 */
const getCommentById = async (id) => {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, isActive: true },
      },
      post: {
        select: { id: true, content: true, creatorId: true },
      },
    },
  });
};

/**
 * Hard delete comment
 */
const deleteCommentById = async (id) => {
  return prisma.comment.delete({
    where: { id },
  });
};

// ==================== CREATORS ====================

/**
 * Get paginated creators with filters
 */
const getCreators = async ({ page = 1, limit = 20, search, verified }) => {
  const skip = (page - 1) * limit;
  const where = { role: 'CREATOR' };

  if (verified !== undefined) where.isVerified = verified;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [creators, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creatorProfile: true,
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    creators,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single creator by ID with full stats
 */
const getCreatorById = async (id) => {
  const creator = await prisma.user.findUnique({
    where: { id, role: 'CREATOR' },
    include: {
      creatorProfile: true,
      _count: {
        select: {
          posts: true,
          subscribers: true,
          reportsReceived: true,
        },
      },
    },
  });

  if (!creator) return null;

  // Calculate total earnings from active subscriptions
  const activeSubCount = await prisma.subscription.count({
    where: { creatorId: id, status: 'ACTIVE' },
  });

  creator.totalEarnings = activeSubCount * (creator.creatorProfile?.price || 0);
  return creator;
};

// ==================== REPORTS ====================

/**
 * Get paginated reports with filters
 */
const getReports = async ({ page = 1, limit = 20, status, type }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (type) where.type = type;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedUser: {
          select: { id: true, username: true, role: true, isActive: true },
        },
        reportedBy: {
          select: { id: true, username: true },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single report by ID
 */
const getReportById = async (id) => {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reportedUser: {
        select: { id: true, username: true, role: true, isActive: true },
      },
      reportedBy: {
        select: { id: true, username: true },
      },
    },
  });
};

/**
 * Update report by ID
 */
const updateReportById = async (id, data) => {
  return prisma.report.update({
    where: { id },
    data,
    include: {
      reportedUser: {
        select: { id: true, username: true, role: true, isActive: true },
      },
      reportedBy: {
        select: { id: true, username: true },
      },
    },
  });
};

/**
 * Get all media keys for a user (for S3 cleanup on user delete)
 */
const getUserMediaKeys = async (userId) => {
  const posts = await prisma.post.findMany({
    where: { creatorId: userId },
    include: { media: { select: { url: true } } },
  });

  const keys = [];
  posts.forEach(post => {
    post.media.forEach(m => keys.push(m.url));
  });
  return keys;
};

module.exports = {
  // Dashboard
  getDashboardStats,
  // Users
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserMediaKeys,
  // Posts
  getPosts,
  getPostById,
  updatePostById,
  getPostMediaKeys,
  deletePostById,
  // Comments
  getComments,
  getCommentById,
  deleteCommentById,
  // Creators
  getCreators,
  getCreatorById,
  // Reports
  getReports,
  getReportById,
  updateReportById,
};

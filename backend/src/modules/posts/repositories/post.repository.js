const { prisma } = require('../../../config/database');

const createPost = async (creatorId, content, visibility, mediaData) => {
  return prisma.post.create({
    data: {
      creatorId,
      content,
      visibility,
      media: {
        create: mediaData // Array of objects { type: 'IMAGE'|'VIDEO', url: '...' }
      }
    },
    include: { media: true }
  });
};

const getPostsByCreatorId = async (creatorId, viewerId = null, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  return prisma.post.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      media: true,
      creator: { select: { id: true, username: true } },
      _count: { select: { likes: true, comments: true } },
      ...(viewerId && { likes: { where: { userId: viewerId }, select: { userId: true } } })
    }
  });
};

const deletePost = async (postId, creatorId) => {
  return prisma.post.delete({
    where: { id: postId, creatorId }
  });
};

const checkSubscription = async (subscriberId, creatorId) => {
  const sub = await prisma.subscription.findFirst({
    where: {
      subscriberId,
      creatorId,
      status: 'ACTIVE'
    }
  });
  return !!sub;
};

const toggleLike = async (userId, postId) => {
  const existing = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (existing) {
    await prisma.like.delete({
      where: { id: existing.id }
    });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: { userId, postId }
    });
    return { liked: true };
  }
};

const getLikesCount = async (postId) => {
  return prisma.like.count({
    where: { postId }
  });
};

const createComment = async (userId, postId, content) => {
  return prisma.comment.create({
    data: {
      userId,
      postId,
      content
    },
    include: {
      user: {
        select: { id: true, username: true }
      }
    }
  });
};

const getCommentsByPostId = async (postId) => {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, username: true }
      }
    }
  });
};

const deleteComment = async (commentId, userId) => {
  return prisma.comment.delete({
    where: {
      id: commentId,
      userId
    }
  });
};

const toggleBookmark = async (userId, postId) => {
  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { id: existing.id }
    });
    return { bookmarked: false };
  } else {
    await prisma.bookmark.create({
      data: { userId, postId }
    });
    return { bookmarked: true };
  }
};

const getBookmarkedPostsByUserId = async (userId) => {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          media: true,
          creator: {
            select: {
              id: true,
              username: true
            }
          },
          likes: {
            select: {
              userId: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      }
    }
  });
};

const getActiveSubscriptionsByCreatorIds = async (subscriberId, creatorIds) => {
  if (!creatorIds.length) return [];
  return prisma.subscription.findMany({
    where: { subscriberId, creatorId: { in: creatorIds }, status: 'ACTIVE' },
    select: { creatorId: true },
  });
};

const findPostById = async (postId) => {
  return prisma.post.findUnique({
    where: { id: postId }
  });
};

const getPostDetails = async (postId, viewerId) => {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      media: true,
      creator: { select: { id: true, username: true } },
      _count: { select: { likes: true, comments: true } },
      ...(viewerId && { likes: { where: { userId: viewerId }, select: { userId: true } } })
    }
  });
};

const updatePost = async (postId, creatorId, data) => {
  return prisma.post.update({
    where: { id: postId, creatorId },
    data,
    include: { media: true }
  });
};

module.exports = {
  createPost,
  getPostsByCreatorId,
  deletePost,
  checkSubscription,
  getActiveSubscriptionsByCreatorIds,
  toggleLike,
  getLikesCount,
  createComment,
  getCommentsByPostId,
  deleteComment,
  toggleBookmark,
  getBookmarkedPostsByUserId,
  findPostById,
  getPostDetails
};

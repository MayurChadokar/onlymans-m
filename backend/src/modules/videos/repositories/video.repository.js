const { prisma } = require('../../../config/database');

const findVideoPostById = async (postId) => {
  return prisma.post.findUnique({
    where: { id: postId },
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

const findMediaById = async (mediaId) => {
  return prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      post: {
        select: {
          creatorId: true,
          visibility: true
        }
      }
    }
  });
};

module.exports = {
  findVideoPostById,
  checkSubscription,
  findMediaById
};

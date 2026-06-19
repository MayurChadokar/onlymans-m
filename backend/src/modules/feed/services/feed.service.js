const { prisma } = require('../../../config/database');
const cache = require('../../../cache/cache.service');

const getRandomFeed = async (userId) => {
  // Short TTL (30s) — keeps it feeling fresh while avoiding repeated heavy queries
  return cache.wrap(`feed:random:${userId}`, 30, async () => {
    const posts = await prisma.post.findMany({
      where: { visibility: 'PUBLIC' },
      select: { id: true }
    });

    const shuffledPostIds = posts.sort(() => 0.5 - Math.random()).slice(0, 10).map(p => p.id);

    const randomPosts = await prisma.post.findMany({
      where: { id: { in: shuffledPostIds } },
      include: {
        media: true,
        creator: {
          select: {
            id: true,
            username: true,
            creatorProfile: {
              select: { avatarUrl: true }
            }
          }
        },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeSubs = await prisma.subscription.findMany({
      where: {
        subscriberId: userId,
        status: 'ACTIVE'
      },
      select: {
        creatorId: true
      }
    });
    const excludeCreatorIds = activeSubs.map(s => s.creatorId);

    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
        id: {
          notIn: [userId, ...excludeCreatorIds]
        },
        creatorProfile: {
          isNot: null
        }
      },
      select: { id: true }
    });

    const shuffledCreatorIds = creators.sort(() => 0.5 - Math.random()).slice(0, 5).map(c => c.id);

    const randomCreators = await prisma.user.findMany({
      where: { id: { in: shuffledCreatorIds } },
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

    return {
      posts: randomPosts.map(p => ({
        ...p,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        isLiked: p.likes.some(l => l.userId === userId),
        _count: undefined,
        likes: undefined
      })),
      suggestedCreators: randomCreators.map(c => ({
        id: c.id,
        username: c.username,
        bio: c.creatorProfile?.bio || '',
        price: c.creatorProfile?.price || 0,
        avatarUrl: c.creatorProfile?.avatarUrl || null,
        coverUrl: c.creatorProfile?.coverUrl || null
      }))
    };
  });
};

module.exports = {
  getRandomFeed,
};

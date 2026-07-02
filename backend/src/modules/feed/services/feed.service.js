const { prisma } = require('../../../config/database');
const cache = require('../../../cache/cache.service');

const getRandomFeed = async (userId, limit = 10, bust = false) => {
  // Rotate every 2 minutes so users auto-get fresh content on each visit
  const timeBucket = Math.floor(Date.now() / (2 * 60 * 1000));
  const cacheKey = `feed:random:${userId}:limit:${limit}:t:${timeBucket}`;

  if (bust) await cache.del(cacheKey);

  return cache.wrap(cacheKey, 120, async () => {
    // 1. Fetch random public post IDs using DB-level randomization
    const randomPostRows = await prisma.$queryRawUnsafe(`SELECT id FROM "Post" WHERE visibility::text = 'PUBLIC' ORDER BY RANDOM() LIMIT $1`, limit);
    const randomPostIds = randomPostRows.map(row => row.id);

    const randomPosts = randomPostIds.length > 0 ? await prisma.post.findMany({
      where: { id: { in: randomPostIds } },
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
        likes: { where: { userId }, select: { userId: true } },
        bookmarks: { where: { userId }, select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' }
    }) : [];

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
    const excludeIds = [userId, ...excludeCreatorIds];

    // 2. Fetch 5 random creator IDs using DB-level randomization
    const randomCreatorRows = await prisma.$queryRaw`
      SELECT u.id
      FROM "User" u
      JOIN "CreatorProfile" cp ON u.id = cp."userId"
      WHERE u.role::text = 'CREATOR'
      AND u.id != ALL (${excludeIds})
      ORDER BY RANDOM()
      LIMIT 5
    `;
    const randomCreatorIds = randomCreatorRows.map(row => row.id);

    const randomCreators = randomCreatorIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: randomCreatorIds } },
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
    }) : [];

    return {
      posts: randomPosts.map(p => ({
        ...p,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        isLiked: p.likes.some(l => l.userId === userId),
        isBookmarked: p.bookmarks.some(b => b.userId === userId),
        _count: undefined,
        likes: undefined,
        bookmarks: undefined
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

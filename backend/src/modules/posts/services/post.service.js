const postRepository = require('../repositories/post.repository');
const s3Service = require('../../media/services/s3.service');
const cache = require('../../../cache/cache.service');
const config = require('../../../config/env');

const POSTS_TTL = config.cache.postsListTTL;

const createPost = async (creatorId, postData) => {
  const mediaData = (postData.media || []).map(m => ({
    type: m.type,
    url: m.url
  }));

  const post = await postRepository.createPost(creatorId, postData.content, postData.visibility, mediaData);
  // Fire and forget cache invalidation to prevent blocking the API response
  cache.delPattern(`feed:creator:${creatorId}:*`).catch(err => console.error(err));
  cache.del(`creator:dashboard:${creatorId}`).catch(err => console.error(err));
  return post;
};

const getCreatorFeed = async (userId, creatorId, page = 1, limit = 50) => {
  return cache.wrap(`feed:creator:${creatorId}:${userId}:page:${page}:limit:${limit}`, POSTS_TTL, async () => {
    const posts = await postRepository.getPostsByCreatorId(creatorId, userId, page, limit);

    const isSubscribed = await postRepository.checkSubscription(userId, creatorId);
    const isOwner = userId === creatorId;

    return await Promise.all(posts.map(async post => {
      const likesCount = post._count?.likes ?? 0;
      const commentsCount = post._count?.comments ?? 0;
      const isLiked = (post.likes || []).some(l => l.userId === userId);

      if (post.visibility === 'PREMIUM' && !isSubscribed && !isOwner) {
        return {
          ...post,
          isLocked: true,
          likesCount,
          commentsCount,
          isLiked,
          _count: undefined,
          likes: undefined,
          media: (post.media || []).map(m => ({
            ...m,
            url: 'https://picsum.photos/seed/onlymans-locked/400/400?blur=10'
          })),
          content: post.content
        };
      }

      const signedMedia = await Promise.all((post.media || []).map(async m => ({
        ...m,
        url: await s3Service.generateViewUrl(m.url)
      })));

      return {
        ...post,
        media: signedMedia,
        isLocked: false,
        likesCount,
        commentsCount,
        isLiked,
        _count: undefined,
        likes: undefined
      };
    }));
  });
};

const deletePost = async (userId, postId) => {
  try {
    await postRepository.deletePost(postId, userId);
    cache.delPattern(`feed:creator:*:${userId}*`).catch(err => console.error(err));
    cache.delPattern(`feed:random:${userId}*`).catch(err => console.error(err));
    cache.del(`creator:dashboard:${userId}`).catch(err => console.error(err));
    cache.del(`user:favorites:${userId}`).catch(err => console.error(err));
  } catch (error) {
    throw new Error('Post not found or you do not have permission to delete it');
  }
};

const togglePostLike = async (userId, postId) => {
  const result = await postRepository.toggleLike(userId, postId);
  cache.delPattern(`feed:creator:*:${userId}*`).catch(err => console.error(err));
  cache.delPattern(`feed:random:${userId}*`).catch(err => console.error(err));
  cache.del(`user:favorites:${userId}`).catch(err => console.error(err));
  return result;
};

const addComment = async (userId, postId, content) => {
  const comment = await postRepository.createComment(userId, postId, content);
  await cache.del(`post:comments:${postId}`);
  cache.delPattern(`feed:creator:*:${userId}*`).catch(err => console.error(err));
  cache.delPattern(`feed:random:${userId}*`).catch(err => console.error(err));
  cache.del(`user:favorites:${userId}`).catch(err => console.error(err));
  return comment;
};

const getPostComments = async (postId) => {
  return cache.wrap(`post:comments:${postId}`, POSTS_TTL, () =>
    postRepository.getCommentsByPostId(postId)
  );
};

const removeComment = async (userId, commentId) => {
  const result = await postRepository.deleteComment(commentId, userId);
  // commentId alone is enough — the post-level key will expire naturally
  return result;
};

const togglePostBookmark = async (userId, postId) => {
  const post = await postRepository.findPostById(postId);
  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const result = await postRepository.toggleBookmark(userId, postId);
  cache.delPattern(`feed:creator:*:${userId}*`).catch(err => console.error(err));
  cache.delPattern(`feed:random:${userId}*`).catch(err => console.error(err));
  await cache.del(`user:favorites:${userId}`);
  return result;
};

const getUserFavorites = async (userId) => {
  return cache.wrap(`user:favorites:${userId}`, POSTS_TTL, async () => {
    const bookmarks = await postRepository.getBookmarkedPostsByUserId(userId);

    // Batch-load all active subscriptions for this user in ONE query instead of one per post
    const uniqueCreatorIds = [...new Set(bookmarks.map(b => b.post.creatorId))];
    const activeSubscriptions = await postRepository.getActiveSubscriptionsByCreatorIds(userId, uniqueCreatorIds);
    const subscribedSet = new Set(activeSubscriptions.map(s => s.creatorId));

    return await Promise.all(bookmarks.map(async (bookmark) => {
      const post = bookmark.post;
      const isOwner = post.creatorId === userId;
      const isSubscribed = subscribedSet.has(post.creatorId);
      const isLocked = post.visibility === 'PREMIUM' && !isSubscribed && !isOwner;

      let media = [];
      if (isLocked) {
        media = (post.media || []).map(m => ({
          ...m,
          url: 'https://picsum.photos/seed/onlymans-locked/400/400?blur=10'
        }));
      } else {
        media = await Promise.all((post.media || []).map(async m => ({
          ...m,
          url: await s3Service.generateViewUrl(m.url)
        })));
      }

      return {
        id: post.id,
        content: post.content,
        visibility: post.visibility,
        creator: post.creator,
        media,
        isLocked,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked: post.likes.some(like => like.userId === userId),
        bookmarkedAt: bookmark.createdAt
      };
    }));
  });
};

const getPostDetails = async (userId, postId) => {
  return cache.wrap(`post:details:${postId}:${userId}`, POSTS_TTL, async () => {
    const post = await postRepository.getPostDetails(postId, userId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const isSubscribed = await postRepository.checkSubscription(userId, post.creatorId);
    const isOwner = userId === post.creatorId;

    const likesCount = post._count?.likes ?? 0;
    const commentsCount = post._count?.comments ?? 0;
    const isLiked = (post.likes || []).some(l => l.userId === userId);

    if (post.visibility === 'PREMIUM' && !isSubscribed && !isOwner) {
      return {
        ...post,
        isLocked: true,
        likesCount,
        commentsCount,
        isLiked,
        _count: undefined,
        likes: undefined,
        media: (post.media || []).map(m => ({
          ...m,
          url: 'https://picsum.photos/seed/onlymans-locked/400/400?blur=10'
        })),
        content: post.content
      };
    }

    const signedMedia = await Promise.all((post.media || []).map(async m => ({
      ...m,
      url: await s3Service.generateViewUrl(m.url)
    })));

    return {
      ...post,
      media: signedMedia,
      isLocked: false,
      likesCount,
      commentsCount,
      isLiked,
      _count: undefined,
      likes: undefined
    };
  });
};

module.exports = {
  createPost,
  getCreatorFeed,
  deletePost,
  togglePostLike,
  addComment,
  getPostComments,
  removeComment,
  togglePostBookmark,
  getUserFavorites,
  getPostDetails
};

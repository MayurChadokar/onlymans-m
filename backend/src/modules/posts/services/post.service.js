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
  await cache.delPattern(`feed:creator:${creatorId}:*`);
  await cache.del(`creator:dashboard:${creatorId}`);
  return post;
};

const getCreatorFeed = async (userId, creatorId) => {
  return cache.wrap(`feed:creator:${creatorId}:${userId}`, POSTS_TTL, async () => {
    const posts = await postRepository.getPostsByCreatorId(creatorId, userId);

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
    await cache.delPattern(`feed:creator:${userId}:*`);
    await cache.del(`creator:dashboard:${userId}`);
  } catch (error) {
    throw new Error('Post not found or you do not have permission to delete it');
  }
};

const togglePostLike = async (userId, postId) => {
  const result = await postRepository.toggleLike(userId, postId);
  await cache.delPattern(`feed:creator:*:${userId}`);
  return result;
};

const addComment = async (userId, postId, content) => {
  const comment = await postRepository.createComment(userId, postId, content);
  await cache.del(`post:comments:${postId}`);
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
  await cache.del(`user:favorites:${userId}`);
  return result;
};

const getUserFavorites = async (userId) => {
  return cache.wrap(`user:favorites:${userId}`, POSTS_TTL, async () => {
    const bookmarks = await postRepository.getBookmarkedPostsByUserId(userId);

    return await Promise.all(bookmarks.map(async (bookmark) => {
      const post = bookmark.post;
      const isOwner = post.creatorId === userId;
      let isSubscribed = false;

      if (!isOwner) {
        isSubscribed = await postRepository.checkSubscription(userId, post.creatorId);
      }

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

module.exports = {
  createPost,
  getCreatorFeed,
  deletePost,
  togglePostLike,
  addComment,
  getPostComments,
  removeComment,
  togglePostBookmark,
  getUserFavorites
};

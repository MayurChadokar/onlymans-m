const videoRepository = require('../repositories/video.repository');
const cloudfrontService = require('../../media/services/cloudfront.service');

const getVideoDetails = async (userId, postId) => {
  const post = await videoRepository.findVideoPostById(postId);
  if (!post) {
    const error = new Error('Video post not found');
    error.statusCode = 404;
    throw error;
  }

  // Find the first media of type VIDEO or any media (fallback check)
  // Our schema model `Media` contains type: image or video
  const videoMedia = post.media.find(m => m.type === 'VIDEO') || post.media[0];
  if (!videoMedia) {
    const error = new Error('Post does not contain any video or media');
    error.statusCode = 400;
    throw error;
  }

  const isOwner = post.creatorId === userId;
  let isSubscribed = false;
  if (!isOwner) {
    isSubscribed = await videoRepository.checkSubscription(userId, post.creatorId);
  }

  const hasAccess = post.visibility === 'PUBLIC' || isSubscribed || isOwner;

  return {
    id: post.id,
    content: post.content,
    visibility: post.visibility,
    creator: {
      id: post.creator.id,
      username: post.creator.username,
      avatarUrl: post.creator.creatorProfile?.avatarUrl || null
    },
    media: {
      id: videoMedia.id,
      type: videoMedia.type
    },
    hasAccess,
    streamUrl: hasAccess ? `/api/v1/videos/${post.id}/stream` : null,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLiked: post.likes.some(like => like.userId === userId)
  };
};

const getVideoStreamUrl = async (userId, postId) => {
  const post = await videoRepository.findVideoPostById(postId);
  if (!post) {
    const error = new Error('Video post not found');
    error.statusCode = 404;
    throw error;
  }

  const videoMedia = post.media.find(m => m.type === 'VIDEO') || post.media[0];
  if (!videoMedia) {
    const error = new Error('Post does not contain video media');
    error.statusCode = 400;
    throw error;
  }

  const isOwner = post.creatorId === userId;
  let isSubscribed = false;
  if (!isOwner) {
    isSubscribed = await videoRepository.checkSubscription(userId, post.creatorId);
  }

  const hasAccess = post.visibility === 'PUBLIC' || isSubscribed || isOwner;
  if (!hasAccess) {
    const error = new Error('Access denied: Active subscription required');
    error.statusCode = 403;
    throw error;
  }

  // Generate signed CloudFront URL for the HLS stream/media file
  const cdnDomain = process.env.CLOUDFRONT_DOMAIN || 'https://cdn.onlymans.com';
  const rawUrl = `${cdnDomain}/${videoMedia.url}`;
  
  // Set link validity for 15 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const signedUrl = cloudfrontService.generateSignedUrl(rawUrl, expiresAt);

  return {
    streamUrl: signedUrl
  };
};

module.exports = {
  getVideoDetails,
  getVideoStreamUrl
};

const postService = require('../services/post.service');
const { notificationService } = require('../../notifications');
const { prisma } = require('../../../config/database');

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    
    res.status(201).json({ post });

    // Fire-and-forget: notify subscribers after response is sent
    prisma.subscription.findMany({
      where: { creatorId: req.user.id, status: 'ACTIVE' },
      select: { subscriberId: true }
    }).then(subscribers =>
      Promise.all(subscribers.map(sub =>
        notificationService.createAndSendNotification(
          sub.subscriberId,
          'NEW_POST',
          'New Post',
          `${req.user.username || 'A creator'} posted something new.`,
          `/post/${post.id}`
        )
      ))
    ).catch(() => {});
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const getCreatorFeed = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const posts = await postService.getCreatorFeed(req.user.id, creatorId, page, limit);
    res.json({ posts, page, limit });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    await postService.deletePost(req.user.id, postId);
    res.status(204).send();
  } catch (error) {
    error.statusCode = 403;
    next(error);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await postService.togglePostLike(req.user.id, postId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const comment = await postService.addComment(req.user.id, postId, content);
    
    // Notify post creator
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { creatorId: true } });
    if (post && post.creatorId !== req.user.id) {
      await notificationService.createAndSendNotification(
        post.creatorId,
        'NEW_COMMENT',
        'New Comment',
        `${req.user.username || 'Someone'} commented on your post.`,
        `/post/${postId}`
      );
    }

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await postService.getPostComments(postId);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    await postService.removeComment(req.user.id, commentId);
    res.status(204).send();
  } catch (error) {
    error.statusCode = 403;
    next(error);
  }
};

const toggleBookmark = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await postService.togglePostBookmark(req.user.id, postId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPostDetails = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await postService.getPostDetails(req.user.id, postId);
    res.json({ post });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getCreatorFeed,
  deletePost,
  toggleLike,
  createComment,
  getComments,
  deleteComment,
  toggleBookmark,
  getPostDetails
};

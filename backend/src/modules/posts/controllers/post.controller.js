const postService = require('../services/post.service');

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ post });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const getCreatorFeed = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const posts = await postService.getCreatorFeed(req.user.id, creatorId);
    res.json({ posts });
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

module.exports = {
  createPost,
  getCreatorFeed,
  deletePost,
  toggleLike,
  createComment,
  getComments,
  deleteComment,
  toggleBookmark
};

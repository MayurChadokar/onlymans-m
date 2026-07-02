const Joi = require('joi');

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string().valid('USER', 'CREATOR', 'ADMIN'),
    status: Joi.string().valid('ACTIVE', 'BLOCKED'),
    search: Joi.string().allow('').max(100),
  }),
};

const getUserById = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

const updateUserStatus = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    isActive: Joi.boolean().required(),
  }),
};

const updateCreatorVerification = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    isVerified: Joi.boolean().required(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

const getPosts = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    visibility: Joi.string().valid('PUBLIC', 'PREMIUM'),
    creatorId: Joi.string().uuid(),
    search: Joi.string().allow('').max(100),
  }),
};

const getPostById = {
  params: Joi.object().keys({
    postId: Joi.string().uuid().required(),
  }),
};

const updatePostVisibility = {
  params: Joi.object().keys({
    postId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    visibility: Joi.string().valid('PUBLIC', 'PREMIUM').required(),
  }),
};

const deletePost = {
  params: Joi.object().keys({
    postId: Joi.string().uuid().required(),
  }),
};

const getComments = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    postId: Joi.string().uuid(),
    userId: Joi.string().uuid(),
  }),
};

const deleteComment = {
  params: Joi.object().keys({
    commentId: Joi.string().uuid().required(),
  }),
};

const blockCommentAuthor = {
  params: Joi.object().keys({
    commentId: Joi.string().uuid().required(),
  }),
};

const getCreators = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('').max(100),
    verified: Joi.boolean(),
  }),
};

const getCreatorById = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

const getReports = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'RESOLVED', 'DISMISSED'),
    type: Joi.string().valid('SPAM', 'CONTENT_VIOLATION', 'HARASSMENT', 'IMPERSONATION', 'OTHER'),
  }),
};

const resolveReport = {
  params: Joi.object().keys({
    reportId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('RESOLVED', 'DISMISSED').required(),
  }),
};

const blockAndResolve = {
  params: Joi.object().keys({
    reportId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  login,
  getUsers,
  getUserById,
  updateUserStatus,
  updateCreatorVerification,
  deleteUser,
  getPosts,
  getPostById,
  updatePostVisibility,
  deletePost,
  getComments,
  deleteComment,
  blockCommentAuthor,
  getCreators,
  getCreatorById,
  getReports,
  resolveReport,
  blockAndResolve,
};

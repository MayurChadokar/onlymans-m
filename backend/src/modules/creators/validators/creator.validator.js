const Joi = require('joi');

const becomeCreator = {
  body: Joi.object().keys({
    bio: Joi.string().allow('').max(500),
    price: Joi.number().min(0).max(1000).default(0.0),
  }),
};

const updateProfile = {
  body: Joi.object().keys({
    bio: Joi.string().allow('').max(500),
    price: Joi.number().min(0).max(1000),
    avatarUrl: Joi.string().uri().allow('', null),
    coverUrl: Joi.string().uri().allow('', null),
  }).min(1),
};

const createTier = {
  body: Joi.object().keys({
    name: Joi.string().min(1).max(100).required(),
    price: Joi.number().min(0).max(1000).required(),
    benefits: Joi.array().items(Joi.string().max(200)).min(1).max(10).required(),
  }),
};

const deleteTier = {
  params: Joi.object().keys({
    tierId: Joi.string().uuid().required(),
  }),
};

const getPublicProfile = {
  params: Joi.object().keys({
    creatorId: Joi.string().required(),
  }),
};

const deleteComment = {
  params: Joi.object().keys({
    commentId: Joi.string().required(),
  }),
};

module.exports = {
  becomeCreator,
  updateProfile,
  getPublicProfile,
  deleteComment,
  createTier,
  deleteTier,
};

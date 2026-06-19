const Joi = require('joi');

const createPost = {
  body: Joi.object().keys({
    content: Joi.string().allow('').max(2000),
    visibility: Joi.string().valid('PUBLIC', 'PREMIUM').required(),
    media: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('IMAGE', 'VIDEO').required(),
        url: Joi.string().uri().required()
      })
    ).max(10).default([]) // Max 10 items per post
  }).min(1) // Must have at least content or media
};

const getCreatorFeed = {
  params: Joi.object().keys({
    creatorId: Joi.string().uuid().required(),
  }),
};

const deletePost = {
  params: Joi.object().keys({
    postId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createPost,
  getCreatorFeed,
  deletePost
};

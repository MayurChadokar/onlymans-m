const Joi = require('joi');

const updateProfile = {
  body: Joi.object().keys({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(30),
  }).min(1),
};

const reportUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    type: Joi.string().valid('SPAM', 'CONTENT_VIOLATION', 'HARASSMENT', 'IMPERSONATION', 'OTHER').required(),
    reason: Joi.string().min(10).max(1000).required(),
  }),
};

module.exports = {
  updateProfile,
  reportUser,
};

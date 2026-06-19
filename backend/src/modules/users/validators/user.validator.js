const Joi = require('joi');

const updateProfile = {
  body: Joi.object().keys({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(30),
  }).min(1),
};

module.exports = {
  updateProfile,
};

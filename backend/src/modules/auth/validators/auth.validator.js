const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    username: Joi.string().required().min(3).max(30),
    role: Joi.string().valid('USER', 'CREATOR').default('USER'),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const refresh = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    newPassword: Joi.string().required().min(8),
  }),
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};

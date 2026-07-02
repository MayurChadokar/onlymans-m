const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const UserDTO = require('../dto/user.dto');
const config = require('../../../config/env');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);

    res.status(201).json({
      user: new UserDTO(user),
      tokens
    });
  } catch (error) {
    if (error.message.includes('already taken')) {
      error.statusCode = 400;
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    const tokens = await tokenService.generateAuthTokens(user);

    res.json({
      user: new UserDTO(user),
      tokens
    });
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAuth(refreshToken);
    
    res.json({
      user: new UserDTO(result.user),
      tokens: result.tokens
    });
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader ? authHeader.split(' ')[1] : null;
    
    await authService.logoutUser(refreshToken, accessToken, config.jwt.accessExpirationMinutes);
    res.status(204).send();
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({ user: new UserDTO(req.user) });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.status(204).send();
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.status(204).send();
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};

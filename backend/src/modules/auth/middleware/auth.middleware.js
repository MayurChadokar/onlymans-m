const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const tokenService = require('../services/token.service');
const userRepository = require('../repositories/user.repository');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Please authenticate');
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted in Redis
    if (await tokenService.isTokenBlacklisted(token)) {
      throw new Error('Token is revoked');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    const user = await userRepository.findUserById(decoded.sub);
    if (!user) {
      throw new Error('Please authenticate');
    }

    if (!user.isActive) {
      throw new Error('User account is disabled');
    }

    req.user = user;
    next();
  } catch (error) {
    const err = new Error(error.message || 'Please authenticate');
    err.statusCode = 401;
    next(err);
  }
};

module.exports = authenticate;

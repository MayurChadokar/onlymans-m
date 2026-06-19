const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../../config/env');
const redisClient = require('../../../config/redis');
const tokenRepository = require('../repositories/token.repository');

const generateAccessToken = (userId, role) => {
  const payload = { sub: userId, role, type: 'access' };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: `${config.jwt.accessExpirationMinutes}m` });
};

const generateRefreshToken = (userId) => {
  const randomString = crypto.randomBytes(40).toString('hex');
  return randomString;
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const saveRefreshToken = async (userId, token, expiresAt) => {
  const hashedToken = hashToken(token);
  await tokenRepository.saveRefreshToken(userId, hashedToken, expiresAt);
};

const generateAuthTokens = async (user) => {
  const accessTokenExpires = new Date();
  accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + config.jwt.accessExpirationMinutes);
  const accessToken = generateAccessToken(user.id, user.role);

  const refreshTokenExpires = new Date();
  refreshTokenExpires.setDate(refreshTokenExpires.getDate() + config.jwt.refreshExpirationDays);
  const refreshToken = generateRefreshToken(user.id);
  await saveRefreshToken(user.id, refreshToken, refreshTokenExpires);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toISOString(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toISOString(),
    },
  };
};

const verifyRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  const tokenRecord = await tokenRepository.findRefreshToken(hashedToken);
  
  if (!tokenRecord) {
    throw new Error('Invalid refresh token');
  }
  
  if (new Date() > tokenRecord.expiresAt) {
    await tokenRepository.deleteRefreshToken(hashedToken);
    throw new Error('Refresh token expired');
  }
  
  return tokenRecord;
};

const revokeRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  await tokenRepository.deleteRefreshToken(hashedToken);
};

const blacklistAccessToken = async (token, expiresInMins) => {
  // Store token in Redis with expiration time matching JWT expiration
  const expiresInSecs = expiresInMins * 60;
  await redisClient.set(`bl_${token}`, 'true', 'EX', expiresInSecs);
};

const isTokenBlacklisted = async (token) => {
  const exists = await redisClient.get(`bl_${token}`);
  return exists === 'true';
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAuthTokens,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  blacklistAccessToken,
  isTokenBlacklisted,
  hashToken,
};

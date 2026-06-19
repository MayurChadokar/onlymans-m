const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { prisma } = require('../../../config/database');

const registerUser = async (userData) => {
  if (await userRepository.findUserByEmail(userData.email)) {
    throw new Error('Email already taken');
  }
  if (await userRepository.findUserByUsername(userData.username)) {
    throw new Error('Username already taken');
  }

  const hashedPassword = await hashPassword(userData.password);

  const user = await userRepository.createUser({
    email: userData.email,
    username: userData.username,
    passwordHash: hashedPassword,
    role: userData.role,
  });

  // If registering directly as CREATOR, auto-create a blank CreatorProfile
  // (price=0, bio/avatar/cover null) so frontend can prompt to complete profile
  if (user.role === 'CREATOR') {
    await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        bio: null,
        price: 0,
        avatarUrl: null,
        coverUrl: null,
      },
    });
  }

  return user;
};


const loginUser = async (email, password) => {
  const user = await userRepository.findUserByEmail(email);
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new Error('Incorrect email or password');
  }
  
  if (!user.isActive) {
    throw new Error('User account is disabled');
  }

  return user;
};

const refreshAuth = async (refreshToken) => {
  try {
    const tokenRecord = await tokenService.verifyRefreshToken(refreshToken);
    const user = tokenRecord.user;

    // Refresh Token Rotation: Delete old token, issue new one
    await tokenService.revokeRefreshToken(refreshToken);

    const tokens = await tokenService.generateAuthTokens(user);

    return { user, tokens };
  } catch (error) {
    throw new Error('Please authenticate');
  }
};

const logoutUser = async (refreshToken, accessToken, expiresInMins) => {
  try {
    await tokenService.revokeRefreshToken(refreshToken);
    if (accessToken) {
       await tokenService.blacklistAccessToken(accessToken, expiresInMins);
    }
  } catch (error) {
    throw new Error('Logout failed');
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await userRepository.findUserById(userId);
  if (!user || !(await comparePassword(oldPassword, user.passwordHash))) {
    throw new Error('Incorrect old password');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  await userRepository.updateUserById(userId, { passwordHash: hashedPassword });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuth,
  logoutUser,
  changePassword,
};

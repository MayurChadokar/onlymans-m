const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { prisma } = require('../../../config/database');
const emailService = require('./email.service');
const crypto = require('crypto');

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

    if (!user.isActive) {
      await tokenService.revokeRefreshToken(refreshToken);
      throw new Error('User account is disabled');
    }

    // Refresh Token Rotation: Delete old token, issue new one
    await tokenService.revokeRefreshToken(refreshToken);

    const tokens = await tokenService.generateAuthTokens(user);

    return { user, tokens };
  } catch (error) {
    throw new Error(error.message || 'Please authenticate');
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

const forgotPassword = async (email) => {
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    // Return silently to prevent email enumeration
    return;
  }

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Save the hashed token to the database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Send the reset email with the unhashed token
  await emailService.sendPasswordResetEmail(user.email, resetToken);
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetTokenRecord) {
    throw new Error('Invalid or expired reset token');
  }

  if (resetTokenRecord.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
    throw new Error('Invalid or expired reset token');
  }

  // Update the user's password
  const hashedPassword = await hashPassword(newPassword);
  await userRepository.updateUserById(resetTokenRecord.userId, { passwordHash: hashedPassword });

  // Delete all reset tokens for this user so they can't be reused
  await prisma.passwordResetToken.deleteMany({
    where: { userId: resetTokenRecord.userId },
  });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuth,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
};

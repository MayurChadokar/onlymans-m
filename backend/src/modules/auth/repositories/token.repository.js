const { prisma } = require('../../../config/database');

const saveRefreshToken = async (userId, tokenHash, expiresAt) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
};

const findRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
};

const deleteRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.delete({
    where: { tokenHash },
  });
};

const deleteAllUserRefreshTokens = async (userId) => {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
};

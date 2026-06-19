const { prisma } = require('../../../config/database');

const createUser = async (userData) => {
  return prisma.user.create({
    data: userData,
  });
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    include: { creatorProfile: true },
  });
};

const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const updateUserById = async (id, updateData) => {
  return prisma.user.update({
    where: { id },
    data: updateData,
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  updateUserById,
};

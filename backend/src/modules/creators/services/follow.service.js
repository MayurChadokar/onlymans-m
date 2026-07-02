const { prisma } = require('../../../config/database');

class FollowService {
  /**
   * Toggles the follow status for a user to a creator.
   * If they are already following, it unfollows them.
   * @param {string} followerId 
   * @param {string} followingId 
   * @returns {Promise<{isFollowing: boolean}>}
   */
  async toggleFollow(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself');
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
      return { isFollowing: false };
    } else {
      await prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      });
      return { isFollowing: true };
    }
  }

  /**
   * Gets a list of IDs the user is currently following.
   * @param {string} userId 
   * @returns {Promise<string[]>}
   */
  async getFollowingIds(userId) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    return following.map(f => f.followingId);
  }
}

module.exports = new FollowService();

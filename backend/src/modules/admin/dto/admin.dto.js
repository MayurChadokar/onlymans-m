/**
 * DTO for admin user list/detail responses.
 * Strips sensitive fields like passwordHash.
 */
class AdminUserDTO {
  constructor(user, stats = {}) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.role = user.role;
    this.isVerified = user.isVerified;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    // Optional stats (populated for detail views)
    if (stats.postsCount !== undefined) this.postsCount = stats.postsCount;
    if (stats.commentsCount !== undefined) this.commentsCount = stats.commentsCount;
    if (stats.subscribersCount !== undefined) this.subscribersCount = stats.subscribersCount;
    if (stats.subscriptionsCount !== undefined) this.subscriptionsCount = stats.subscriptionsCount;
  }
}

/**
 * DTO for admin creator list/detail responses.
 * Includes creator profile + aggregated stats.
 */
class AdminCreatorDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.role = user.role;
    this.isVerified = user.isVerified;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;

    // Creator profile
    if (user.creatorProfile) {
      this.profile = {
        bio: user.creatorProfile.bio,
        price: user.creatorProfile.price,
        avatarUrl: user.creatorProfile.avatarUrl,
        coverUrl: user.creatorProfile.coverUrl,
      };
    }

    // Aggregated stats
    this.subscribersCount = user._count?.subscribers || 0;
    this.postsCount = user._count?.posts || 0;
    this.totalEarnings = user.totalEarnings || 0;
  }
}

/**
 * DTO for admin post responses.
 */
class AdminPostDTO {
  constructor(post) {
    this.id = post.id;
    this.content = post.content;
    this.visibility = post.visibility;
    this.commentsEnabled = post.commentsEnabled;
    this.createdAt = post.createdAt;
    this.updatedAt = post.updatedAt;

    // Creator info
    if (post.creator) {
      this.creator = {
        id: post.creator.id,
        username: post.creator.username,
        isVerified: post.creator.isVerified,
      };
    }

    // Media
    this.media = (post.media || []).map(m => ({
      id: m.id,
      type: m.type,
      url: m.url,
    }));

    // Counts
    this.likesCount = post._count?.likes || 0;
    this.commentsCount = post._count?.comments || 0;
    this.bookmarksCount = post._count?.bookmarks || 0;
  }
}

/**
 * DTO for admin comment responses.
 */
class AdminCommentDTO {
  constructor(comment) {
    this.id = comment.id;
    this.content = comment.content;
    this.createdAt = comment.createdAt;

    if (comment.user) {
      this.user = {
        id: comment.user.id,
        username: comment.user.username,
        isActive: comment.user.isActive,
      };
    }

    if (comment.post) {
      this.post = {
        id: comment.post.id,
        content: comment.post.content ? comment.post.content.substring(0, 100) : null,
        creatorId: comment.post.creatorId,
      };
    }
  }
}

/**
 * DTO for admin report responses.
 */
class AdminReportDTO {
  constructor(report) {
    this.id = report.id;
    this.type = report.type;
    this.reason = report.reason;
    this.status = report.status;
    this.createdAt = report.createdAt;
    this.updatedAt = report.updatedAt;

    if (report.reportedUser) {
      this.reportedUser = {
        id: report.reportedUser.id,
        username: report.reportedUser.username,
        role: report.reportedUser.role,
        isActive: report.reportedUser.isActive,
      };
    }

    if (report.reportedBy) {
      this.reportedBy = {
        id: report.reportedBy.id,
        username: report.reportedBy.username,
      };
    }
  }
}

module.exports = {
  AdminUserDTO,
  AdminCreatorDTO,
  AdminPostDTO,
  AdminCommentDTO,
  AdminReportDTO,
};

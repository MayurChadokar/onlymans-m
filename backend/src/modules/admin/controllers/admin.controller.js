const adminRepo = require('../repositories/admin.repository');
const {
  AdminUserDTO,
  AdminCreatorDTO,
  AdminPostDTO,
  AdminCommentDTO,
  AdminReportDTO,
} = require('../dto/admin.dto');

// ==================== DASHBOARD ====================

const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminRepo.getDashboardStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// ==================== USERS ====================

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role, status, search } = req.query;
    const result = await adminRepo.getUsers({ page: +page, limit: +limit, role, status, search });
    const users = result.users.map((u) => new AdminUserDTO(u, {
      postsCount: u._count?.posts,
      commentsCount: u._count?.comments,
      subscribersCount: u._count?.subscribers,
      subscriptionsCount: u._count?.subscriptions,
    }));
    res.json({ users, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminRepo.getUserById(req.params.userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ user: new AdminUserDTO(user, {
      postsCount: user._count?.posts,
      commentsCount: user._count?.comments,
      subscribersCount: user._count?.subscribers,
      subscriptionsCount: user._count?.subscriptions,
    }) });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const user = await adminRepo.updateUserById(userId, { isActive });
    res.json({ user: new AdminUserDTO(user) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await adminRepo.deleteUserById(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== CREATORS ====================

const listCreators = async (req, res, next) => {
  try {
    const { page, limit, search, verified } = req.query;
    const verifiedBool = verified === undefined ? undefined : verified === 'true' || verified === true;
    const result = await adminRepo.getCreators({ page: +page, limit: +limit, search, verified: verifiedBool });
    const creators = result.creators.map((c) => new AdminCreatorDTO(c));
    res.json({ creators, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getCreatorById = async (req, res, next) => {
  try {
    const creator = await adminRepo.getCreatorById(req.params.userId);
    if (!creator) {
      const err = new Error('Creator not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ creator: new AdminCreatorDTO(creator) });
  } catch (error) {
    next(error);
  }
};

const updateCreatorVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;
    const user = await adminRepo.updateUserById(userId, { isVerified });
    res.json({ user: new AdminUserDTO(user) });
  } catch (error) {
    next(error);
  }
};

// ==================== POSTS ====================

const listPosts = async (req, res, next) => {
  try {
    const { page, limit, visibility, creatorId, search } = req.query;
    const result = await adminRepo.getPosts({ page: +page, limit: +limit, visibility, creatorId, search });
    const posts = result.posts.map((p) => new AdminPostDTO(p));
    res.json({ posts, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await adminRepo.getPostById(req.params.postId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ post: new AdminPostDTO(post) });
  } catch (error) {
    next(error);
  }
};

const updatePostVisibility = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { visibility } = req.body;
    const post = await adminRepo.updatePostById(postId, { visibility });
    res.json({ post: new AdminPostDTO(post) });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    await adminRepo.deletePostById(postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMENTS ====================

const listComments = async (req, res, next) => {
  try {
    const { page, limit, postId, userId } = req.query;
    const result = await adminRepo.getComments({ page: +page, limit: +limit, postId, userId });
    const comments = result.comments.map((c) => new AdminCommentDTO(c));
    res.json({ comments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    await adminRepo.deleteCommentById(commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const blockCommentAuthor = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await adminRepo.getCommentById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      return next(err);
    }
    const user = await adminRepo.updateUserById(comment.user.id, { isActive: false });
    res.json({ message: 'Comment author blocked', user: new AdminUserDTO(user) });
  } catch (error) {
    next(error);
  }
};

// ==================== REPORTS ====================

const listReports = async (req, res, next) => {
  try {
    const { page, limit, status, type } = req.query;
    const result = await adminRepo.getReports({ page: +page, limit: +limit, status, type });
    const reports = result.reports.map((r) => new AdminReportDTO(r));
    res.json({ reports, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const report = await adminRepo.updateReportById(reportId, { status });
    res.json({ report: new AdminReportDTO(report) });
  } catch (error) {
    next(error);
  }
};

const blockAndResolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const report = await adminRepo.getReportById(reportId);
    if (!report) {
      const err = new Error('Report not found');
      err.statusCode = 404;
      return next(err);
    }
    // Block the reported user and resolve the report in parallel
    const [updatedReport] = await Promise.all([
      adminRepo.updateReportById(reportId, { status: 'RESOLVED' }),
      adminRepo.updateUserById(report.reportedUser.id, { isActive: false }),
    ]);
    res.json({ message: 'User blocked and report resolved', report: new AdminReportDTO(updatedReport) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  listCreators,
  getCreatorById,
  updateCreatorVerification,
  listPosts,
  getPostById,
  updatePostVisibility,
  deletePost,
  listComments,
  deleteComment,
  blockCommentAuthor,
  listReports,
  resolveReport,
  blockAndResolveReport,
};

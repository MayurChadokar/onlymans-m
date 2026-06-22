const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../../../middleware/validator');
const adminValidator = require('../validators/admin.validator');

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Users
router.get('/users', validate(adminValidator.getUsers), adminController.listUsers);
router.get('/users/:userId', validate(adminValidator.getUserById), adminController.getUserById);
router.patch('/users/:userId/status', validate(adminValidator.updateUserStatus), adminController.updateUserStatus);
router.delete('/users/:userId', validate(adminValidator.deleteUser), adminController.deleteUser);

// Creators
router.get('/creators', validate(adminValidator.getCreators), adminController.listCreators);
router.get('/creators/:userId', validate(adminValidator.getCreatorById), adminController.getCreatorById);
router.patch('/creators/:userId/verify', validate(adminValidator.updateCreatorVerification), adminController.updateCreatorVerification);

// Posts
router.get('/posts', validate(adminValidator.getPosts), adminController.listPosts);
router.get('/posts/:postId', validate(adminValidator.getPostById), adminController.getPostById);
router.patch('/posts/:postId/visibility', validate(adminValidator.updatePostVisibility), adminController.updatePostVisibility);
router.delete('/posts/:postId', validate(adminValidator.deletePost), adminController.deletePost);

// Comments
router.get('/comments', validate(adminValidator.getComments), adminController.listComments);
router.delete('/comments/:commentId', validate(adminValidator.deleteComment), adminController.deleteComment);
router.post('/comments/:commentId/block-author', validate(adminValidator.blockCommentAuthor), adminController.blockCommentAuthor);

// Reports
router.get('/reports', validate(adminValidator.getReports), adminController.listReports);
router.patch('/reports/:reportId/resolve', validate(adminValidator.resolveReport), adminController.resolveReport);
router.post('/reports/:reportId/block-and-resolve', validate(adminValidator.blockAndResolve), adminController.blockAndResolveReport);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only platform management endpoints. Requires ADMIN role.
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get platform dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalCreators:
 *                       type: integer
 *                     verifiedCreators:
 *                       type: integer
 *                     activeSubscriptions:
 *                       type: integer
 *                     pendingReports:
 *                       type: integer
 *                     totalComments:
 *                       type: integer
 *                     totalPosts:
 *                       type: integer
 *                     blockedUsers:
 *                       type: integer
 *                     monthlyRevenue:
 *                       type: number
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, CREATOR, ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: User not found
 *   delete:
 *     summary: Hard delete a user and all their data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: User deleted successfully
 *       "404":
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: Block or unblock a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: false to block, true to unblock
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: User not found
 */

/**
 * @swagger
 * /admin/creators:
 *   get:
 *     summary: List all creators with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *     responses:
 *       "200":
 *         description: OK
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/creators/{userId}:
 *   get:
 *     summary: Get a single creator with full stats and earnings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Creator not found
 */

/**
 * @swagger
 * /admin/creators/{userId}/verify:
 *   patch:
 *     summary: Verify or unverify a creator
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Creator not found
 */

/**
 * @swagger
 * /admin/posts:
 *   get:
 *     summary: List all posts with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [PUBLIC, PREMIUM]
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: OK
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/posts/{postId}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Post not found
 *   delete:
 *     summary: Hard delete a post
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Post deleted successfully
 *       "404":
 *         description: Post not found
 */

/**
 * @swagger
 * /admin/posts/{postId}/visibility:
 *   patch:
 *     summary: Change a post's visibility (PUBLIC / PREMIUM)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PREMIUM]
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Post not found
 */

/**
 * @swagger
 * /admin/comments:
 *   get:
 *     summary: List all comments with optional filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: OK
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Comment deleted successfully
 *       "404":
 *         description: Comment not found
 */

/**
 * @swagger
 * /admin/comments/{commentId}/block-author:
 *   post:
 *     summary: Block the author of a comment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Comment author blocked
 *       "404":
 *         description: Comment not found
 */

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: List all reports with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RESOLVED, DISMISSED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SPAM, CONTENT_VIOLATION, HARASSMENT, IMPERSONATION, OTHER]
 *     responses:
 *       "200":
 *         description: OK
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/reports/{reportId}/resolve:
 *   patch:
 *     summary: Resolve or dismiss a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RESOLVED, DISMISSED]
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Report not found
 */

/**
 * @swagger
 * /admin/reports/{reportId}/block-and-resolve:
 *   post:
 *     summary: Block the reported user and resolve the report in one action
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: User blocked and report resolved
 *       "404":
 *         description: Report not found
 */

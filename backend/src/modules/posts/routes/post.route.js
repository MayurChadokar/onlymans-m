const express = require('express');
const postController = require('../controllers/post.controller');
const postValidator = require('../validators/post.validator');
const validate = require('../../../middleware/validator');
const authenticate = require('../../auth/middleware/auth.middleware');
const requireRole = require('../../auth/middleware/role.middleware');
const { roles } = require('../../../common/roles');

const router = express.Router();

// All posts endpoints require the user to be logged in
router.use(authenticate);

// Feed retrieval - Any authenticated user can view a feed (but services will censor PREMIUM content)
router.get('/creator/:creatorId', validate(postValidator.getCreatorFeed), postController.getCreatorFeed);

// Get single post
router.get('/:postId', postController.getPostDetails);

// Creator specific endpoints
router.post('/', requireRole(roles.CREATOR), validate(postValidator.createPost), postController.createPost);
router.delete('/:postId', requireRole(roles.CREATOR), validate(postValidator.deletePost), postController.deletePost);

// Likes
router.post('/:postId/like', postController.toggleLike);

// Favorites
router.post('/:postId/favorite', postController.toggleBookmark);

// Comments
router.post('/:postId/comments', postController.createComment);
router.get('/:postId/comments', postController.getComments);
router.delete('/comments/:commentId', postController.deleteComment);

module.exports = router;

/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     summary: Toggle like status on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       "200":
 *         description: OK
 *
 * /posts/{postId}/favorite:
 *   post:
 *     summary: Toggle favorite/saved status on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarked:
 *                   type: boolean
 *                   description: True if bookmarked/saved, false if removed
 *
 * /posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       "200":
 *         description: OK
 *
 * /posts/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       "204":
 *         description: No Content
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post and Media management
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post (Creator Only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               content:
 *                 type: string
 *                 description: Text caption
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PREMIUM]
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [IMAGE, VIDEO]
 *                     url:
 *                       type: string
 *     responses:
 *       "201":
 *         description: Created
 */

/**
 * @swagger
 * /posts/creator/{creatorId}:
 *   get:
 *     summary: Get all posts from a specific creator
 *     description: Returns the posts. If a post is PREMIUM and the logged-in user is NOT subscribed, the media URLs are hidden and `isLocked` is true.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "204":
 *         description: No content
 */

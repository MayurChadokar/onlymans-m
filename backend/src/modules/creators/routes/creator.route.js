const express = require('express');
const creatorController = require('../controllers/creator.controller');
const creatorValidator = require('../validators/creator.validator');
const validate = require('../../../middleware/validator');
const authenticate = require('../../auth/middleware/auth.middleware');
const requireRole = require('../../auth/middleware/role.middleware');
const { roles } = require('../../../common/roles');

const router = express.Router();

// Public routes to explore and view creator profiles
router.get('/', creatorController.browseCreators);
router.get('/public/:creatorId', validate(creatorValidator.getPublicProfile), creatorController.getPublicProfile);

// Authenticated routes
router.use(authenticate);

// Become a creator
router.post('/become', validate(creatorValidator.becomeCreator), creatorController.becomeCreator);

// Secure authenticated profile details
router.get('/profile/secure/:creatorId', creatorController.getSecureProfile);

// Creator-only routes (Dashboard & Updating Price/Bio)
router.patch('/profile', requireRole(roles.CREATOR), validate(creatorValidator.updateProfile), creatorController.updateProfile);
router.get('/dashboard', requireRole(roles.CREATOR), creatorController.getDashboard);

// Creator comments moderation
router.get('/comments', requireRole(roles.CREATOR), creatorController.getCreatorComments);
router.delete('/comments/:commentId', requireRole(roles.CREATOR), validate(creatorValidator.deleteComment), creatorController.deleteCreatorComment);

// Subscription tiers
router.get('/tiers', requireRole(roles.CREATOR), creatorController.getTiers);
router.post('/tiers', requireRole(roles.CREATOR), validate(creatorValidator.createTier), creatorController.createTier);
router.delete('/tiers/:tierId', requireRole(roles.CREATOR), validate(creatorValidator.deleteTier), creatorController.deleteTier);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Creators
 *   description: Creator profile and dashboard management
 */

/**
 * @swagger
 * /creators/public/{creatorId}:
 *   get:
 *     summary: Get public profile of a creator
 *     tags: [Creators]
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator's User ID
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /creators/become:
 *   post:
 *     summary: Upgrade current user account to a CREATOR
 *     tags: [Creators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Monthly subscription price
 *     responses:
 *       "201":
 *         description: Successfully became a creator
 */

/**
 * @swagger
 * /creators/profile:
 *   patch:
 *     summary: Update creator bio and price
 *     tags: [Creators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /creators/dashboard:
 *   get:
 *     summary: View creator dashboard statistics and subscribers
 *     tags: [Creators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /creators/profile/secure/{creatorId}:
 *   get:
 *     summary: Get secure creator profile and posts based on subscription status
 *     tags: [Creators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator's User ID
 *     responses:
 *       "200":
 *         description: OK
 */

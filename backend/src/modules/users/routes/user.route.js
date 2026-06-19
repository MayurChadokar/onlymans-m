const express = require('express');
const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const validate = require('../../../middleware/validator');
const authenticate = require('../../auth/middleware/auth.middleware');

const router = express.Router();

const { upload } = require('../../media/services/cloudinary.service');

router.use(authenticate);

router.get('/dashboard', userController.getDashboard);
router.get('/profile', userController.getProfile);
router.patch('/profile', validate(userValidator.updateProfile), userController.updateProfile);
router.put('/avatar', upload.single('avatar'), userController.updateAvatar);
router.delete('/profile', userController.deactivateAccount);
router.get('/subscriptions', userController.getMySubscriptions);
router.post('/subscriptions/:subscriptionId/cancel', userController.cancelSubscription);
router.get('/favorites', userController.getFavorites);
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods', userController.addPaymentMethod);
router.delete('/payment-methods/:methodId', userController.removePaymentMethod);

module.exports = router;

/**
 * @swagger
 * /users/profile:
 *   delete:
 *     summary: Deactivate user account (Soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *
 * /users/subscriptions/{subscriptionId}/cancel:
 *   post:
 *     summary: Cancel a creator subscription
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID to cancel
 *     responses:
 *       "200":
 *         description: OK
 *
 * /users/payment-methods:
 *   get:
 *     summary: Get mock user payment methods
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *   post:
 *     summary: Add mock user payment method
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               last4:
 *                 type: string
 *               expMonth:
 *                 type: integer
 *               expYear:
 *                 type: integer
 *     responses:
 *       "201":
 *         description: Created
 *
 * /users/payment-methods/{methodId}:
 *   delete:
 *     summary: Delete mock user payment method
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and retrieval
 */

/**
 * @swagger
 * /users/dashboard:
 *   get:
 *     summary: Get user dashboard statistics, subscriptions, and recommendations
 *     tags: [Users]
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
 *                 user:
 *                   type: object
 *                 stats:
 *                   type: object
 *                 activeSubscriptions:
 *                   type: array
 *                 recentPosts:
 *                   type: array
 *                 suggestedCreators:
 *                   type: array
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /users/subscriptions:
 *   get:
 *     summary: Get list of active creator subscriptions for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *
 * /users/favorites:
 *   get:
 *     summary: Get list of bookmarked posts for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

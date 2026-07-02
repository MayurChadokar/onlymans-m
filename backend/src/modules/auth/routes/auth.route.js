const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const validate = require('../../../middleware/validator');
const authenticate = require('../middleware/auth.middleware');
const { authLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, validate(authValidator.register), authController.register);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/refresh', validate(authValidator.refresh), authController.refresh);
router.post('/logout', validate(authValidator.logout), authController.logout);
router.post('/forgot-password', authLimiter, validate(authValidator.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidator.resetPassword), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, validate(authValidator.changePassword), authController.changePassword);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, CREATOR]
 *     responses:
 *       "201":
 *         description: Created
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

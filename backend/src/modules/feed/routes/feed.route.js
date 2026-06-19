const express = require('express');
const feedController = require('../controllers/feed.controller');
const authenticate = require('../../auth/middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/random', feedController.getRandomFeed);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Feed generation and exploration
 */

/**
 * @swagger
 * /feed/random:
 *   get:
 *     summary: Get a random discovery feed containing public posts and suggested creators
 *     tags: [Feed]
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
 *                 posts:
 *                   type: array
 *                 suggestedCreators:
 *                   type: array
 */

const express = require('express');
const videoController = require('../controllers/video.controller');
const authenticate = require('../../auth/middleware/auth.middleware');

const router = express.Router();

// Require active login session
router.use(authenticate);

router.get('/:postId', videoController.getVideo);
router.get('/:postId/stream', videoController.streamVideo);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Secured Video streaming and player details
 */

/**
 * @swagger
 * /videos/{postId}:
 *   get:
 *     summary: Retrieve video details and check viewer access
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video post ID
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /videos/{postId}/stream:
 *   get:
 *     summary: Generate secure CloudFront signed URL for video streaming chunks
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video post ID
 *     responses:
 *       "200":
 *         description: OK
 *       "403":
 *         description: Forbidden - subscription required
 */

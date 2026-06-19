const express = require('express');
const mediaController = require('../controllers/media.controller');
const authenticate = require('../../auth/middleware/auth.middleware');
const requireRole = require('../../auth/middleware/role.middleware');
const { roles } = require('../../../common/roles');

const { upload, localUpload } = require('../services/cloudinary.service');
const chunkController = require('../controllers/chunk.controller');

const router = express.Router();

// Route for direct media upload using Cloudinary
router.use(authenticate);
router.post('/upload', requireRole(roles.CREATOR), upload.single('file'), mediaController.uploadMedia);

// Route for chunked video upload
router.post('/upload/chunk', requireRole(roles.CREATOR), localUpload.single('chunk'), chunkController.uploadChunk);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media upload management
 */

/**
 * @swagger
 * /media/upload-url:
 *   post:
 *     summary: Get a pre-signed S3 URL to upload a file directly from client
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *             properties:
 *               contentType:
 *                 type: string
 *                 example: image/jpeg
 *     responses:
 *       "200":
 *         description: OK
 */

const express = require('express');
const followController = require('../controllers/follow.controller');
const authenticate = require('../../auth/middleware/auth.middleware');

const router = express.Router();

// Authenticated routes
router.use(authenticate);

router.get('/following', followController.getFollowing);
router.post('/:creatorId/follow', followController.toggleFollow);

module.exports = router;

const express = require('express');
const healthRoute = require('./health');
const docsRoute = require('./docs.route');
const { authRoutes } = require('../../modules/auth');
const { userRoutes } = require('../../modules/users');
const { creatorRoutes, followRoutes } = require('../../modules/creators');
const { postRoutes } = require('../../modules/posts');
const { mediaRoutes } = require('../../modules/media');
const { feedRoutes } = require('../../modules/feed');
const { videoRoutes } = require('../../modules/videos');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/health',
    route: healthRoute,
  },
  {
    path: '/docs',
    route: docsRoute,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/creators',
    route: creatorRoutes,
  },
  {
    path: '/creators',
    route: followRoutes,
  },
  {
    path: '/posts',
    route: postRoutes,
  },
  {
    path: '/media',
    route: mediaRoutes,
  },
  {
    path: '/feed',
    route: feedRoutes,
  },
  {
    path: '/videos',
    route: videoRoutes,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;

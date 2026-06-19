const authRoutes = require('./routes/auth.route');
const authService = require('./services/auth.service');
const tokenService = require('./services/token.service');
const userRepository = require('./repositories/user.repository');

module.exports = {
  authRoutes,
  authService,
  tokenService,
  userRepository,
};

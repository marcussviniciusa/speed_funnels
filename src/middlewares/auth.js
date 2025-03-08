// Arquivo de redirecionamento para manter compatibilidade
const authMiddleware = require('./auth.middleware');

module.exports = {
  authMiddleware: authMiddleware.authenticate,
  authorize: authMiddleware.authorize
};

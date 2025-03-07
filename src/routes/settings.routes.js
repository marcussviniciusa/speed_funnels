const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticate);

// Rotas de configurações gerais
router.get('/account', settingsController.getAccountSettings);
router.put('/account', settingsController.updateAccountSettings);

// Rotas de notificações
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Rotas de integrações
router.get('/integrations', settingsController.getIntegrationSettings);
router.put('/integrations/:provider', settingsController.updateIntegrationSettings);

module.exports = router;

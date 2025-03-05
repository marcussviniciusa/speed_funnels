const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para Meta
router.get('/meta/auth/:companyId', integrationController.startMetaIntegration);
router.get('/meta/callback', integrationController.metaCallback);

// Rotas para Google Analytics
router.get('/google/auth/:companyId', integrationController.startGoogleIntegration);
router.get('/google/callback', integrationController.googleCallback);

// Listar integrações de uma empresa
router.get('/company/:companyId', integrationController.listIntegrations);

// Desativar uma integração
router.put('/:integrationId/disable', integrationController.disableIntegration);

module.exports = router; 
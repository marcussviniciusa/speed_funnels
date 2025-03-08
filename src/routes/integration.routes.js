const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Listar todas as integrações do usuário atual
router.get('/', integrationController.getAllIntegrations);

// Rotas para Meta
router.get('/meta/auth/:companyId', integrationController.startMetaIntegration);
router.get('/meta/callback', integrationController.metaCallback);
router.post('/meta/connect/:companyId', integrationController.connectMetaWithToken);
// A rota pública para callback foi movida para auth.callback.routes.js

// Rotas para Google Analytics
router.get('/google/auth/:companyId', integrationController.startGoogleIntegration);
router.get('/google/callback', integrationController.googleCallback);

// Listar integrações de uma empresa
router.get('/company/:companyId', integrationController.listIntegrations);

// Desativar uma integração
router.put('/:integrationId/disable', integrationController.disableIntegration);

// Novas rotas para sincronização de dados
router.post('/company/:companyId/sync', integrationController.syncCompanyData);
router.post('/connection/:connectionId/sync', integrationController.syncConnectionData);

module.exports = router;
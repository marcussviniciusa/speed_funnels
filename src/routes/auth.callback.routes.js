const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');

// Rotas públicas para callbacks de integrações (não requerem autenticação)
router.get('/callback/facebook', integrationController.metaPublicCallback);

module.exports = router;

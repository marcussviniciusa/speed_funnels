const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metrics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rotas para métricas do Meta Ads
router.get('/meta/accounts/company/:companyId', metricsController.getMetaAdAccounts);
router.get('/meta/:adAccountId', metricsController.getMetaMetrics);

// Rotas para métricas do Google Analytics
router.get('/google/properties', metricsController.getGoogleProperties);
router.get('/google/:propertyId', metricsController.getGoogleMetrics);

module.exports = router;

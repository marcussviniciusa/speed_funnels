const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const adDataController = require('../controllers/adData.controller');

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

// Listar dados de anúncios para uma empresa
router.get('/company/:companyId', adDataController.getAdDataByCompany);

// Listar dados de anúncios para uma conexão específica
router.get('/connection/:connectionId', adDataController.getAdDataByConnection);

// Obter estatísticas de desempenho consolidadas
router.get('/performance/company/:companyId', adDataController.getPerformanceStats);

// Obter dados de campanhas
router.get('/campaigns/company/:companyId', adDataController.getCampaignData);

// Obter dados de conjuntos de anúncios
router.get('/adsets/company/:companyId', adDataController.getAdSetData);

// Obter dados de anúncios individuais
router.get('/ads/company/:companyId', adDataController.getAdData);

// Iniciar sincronização manual
router.post('/sync/connection/:connectionId', adDataController.syncConnection);

// Iniciar sincronização manual para todas as conexões de uma empresa
router.post('/sync/company/:companyId', adDataController.syncCompanyConnections);

// ===== Rotas para sincronização em tempo real =====

// Sincronizar agora (em tempo real)
router.post('/sync/now', adDataController.syncNow);

// Alterar modo de sincronização (tempo real ou intervalo)
router.post('/sync/mode', adDataController.changeSyncMode);

// Obter status de sincronização atual
router.get('/sync/status', adDataController.getSyncStatus);

module.exports = router;

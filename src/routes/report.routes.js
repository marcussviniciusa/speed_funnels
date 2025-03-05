const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para dashboard
router.get('/meta/dashboard', reportController.getMetaDashboard);
router.get('/google/dashboard', reportController.getGoogleDashboard);

// Rotas para relatórios personalizados
router.post('/create', reportController.createReport);
router.get('/list', reportController.listReports);
router.get('/:reportId', reportController.getReport);
router.put('/:reportId', reportController.updateReport);
router.delete('/:reportId', reportController.deleteReport);

// Rotas para links públicos
router.post('/:reportId/share', reportController.createPublicLink);

// Rota pública (não requer autenticação)
router.get('/public/:publicId', reportController.getPublicReport);

// Exportar rotas
module.exports = router; 
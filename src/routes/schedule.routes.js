const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para agendamentos
router.post('/create', scheduleController.createSchedule);
router.get('/report/:reportId', scheduleController.listSchedules);
router.put('/:scheduleId', scheduleController.updateSchedule);
router.delete('/:scheduleId', scheduleController.deleteSchedule);
router.post('/:scheduleId/run', scheduleController.runScheduleManually);

module.exports = router; 
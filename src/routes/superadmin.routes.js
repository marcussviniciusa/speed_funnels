const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const superadminMiddleware = require('../middlewares/superadmin.middleware');

// Apply authentication and superadmin check to all routes
router.use('/', authMiddleware.authenticate, superadminMiddleware.isSuperAdmin);

// Dashboard routes
router.get('/dashboard/stats', superadminController.getDashboardStats);

// Company management routes
router.get('/companies', superadminController.getCompanies);
router.post('/companies', superadminController.createCompany);
router.put('/companies/:id', superadminController.updateCompany);

// User management routes
router.get('/users', superadminController.getUsers);
router.post('/users', superadminController.createUser);
router.put('/users/:id', superadminController.updateUser);
router.post('/users/transfer', superadminController.transferUser);

module.exports = router;

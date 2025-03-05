const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Registro público (somente usuário básico)
router.post('/register', authController.register);

// Registro de admin/superadmin (restrito a superadmin)
router.post('/register/admin', authenticate, authorize('superadmin'), authController.register);

// Login
router.post('/login', authController.login);

module.exports = router; 
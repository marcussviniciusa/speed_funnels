const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para o perfil do usuário atual
router.get('/me', userController.getCurrentUser);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Rotas para gerenciamento de usuários (apenas admin)
router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

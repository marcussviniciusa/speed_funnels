const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Listar todas as empresas do usuário
router.get('/', companyController.getUserCompanies);

// Criar uma nova empresa
router.post('/', companyController.createCompany);

// Obter detalhes de uma empresa específica
router.get('/:companyId', companyController.getCompanyDetails);

// Atualizar uma empresa
router.put('/:companyId', companyController.updateCompany);

// Adicionar usuário a uma empresa
router.post('/:companyId/users', companyController.addUserToCompany);

module.exports = router;

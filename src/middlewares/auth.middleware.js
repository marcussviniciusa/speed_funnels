const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { User, Company } = require('../models');

// Middleware de autenticação
exports.authenticate = async (req, res, next) => {
  try {
    // Em ambiente de desenvolvimento, simular um usuário autenticado
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: 1,
        email: 'teste@example.com',
        name: 'Usuário Teste',
        role: 'admin',
        companyId: 1
      };
      return next();
    }
    
    // Verificar se o token está presente
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Token de autenticação não fornecido');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Company,
        as: 'companies',
        through: { attributes: ['role'] }
      }]
    });
    
    if (!user) {
      throw createError(401, 'Usuário não encontrado');
    }
    
    // Adicionar usuário ao objeto de requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companies: user.companies,
      // Se o usuário tiver empresas, usar a primeira como padrão
      companyId: user.companies && user.companies.length > 0 ? user.companies[0].id : null
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(createError(401, 'Token inválido'));
    } else if (error.name === 'TokenExpiredError') {
      next(createError(401, 'Token expirado'));
    } else {
      next(error);
    }
  }
};

// Middleware de autorização baseado em roles
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Não autenticado'));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(createError(403, 'Acesso negado'));
    }
    
    next();
  };
};
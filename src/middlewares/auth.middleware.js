const jwt = require('jsonwebtoken');
const createError = require('http-errors');

// Middleware de autenticação simplificado para desenvolvimento
exports.authenticate = async (req, res, next) => {
  try {
    // Em ambiente de desenvolvimento, simular um usuário autenticado
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
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
    
    // Em um ambiente real, aqui buscaríamos o usuário no banco de dados
    // const user = await User.findByPk(decoded.id);
    
    // Adicionar usuário ao objeto de requisição
    req.user = {
      ...decoded,
      companyId: decoded.companyId || 1 // Garantir que sempre temos um companyId
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
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Usuário não autenticado'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Acesso não autorizado'));
    }
    
    next();
  };
};
const { User, Company } = require('../models');
const createError = require('http-errors');

/**
 * Obter o usuário autenticado atual
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Em ambiente de desenvolvimento, retornar o usuário simulado
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          companies: [{
            id: req.user.companyId,
            name: 'Empresa Teste',
            UserCompany: { role: 'admin' }
          }]
        }
      });
    }
    
    // Buscar o usuário no banco de dados com suas empresas
    const user = await User.findByPk(userId, {
      include: [{
        model: Company,
        as: 'companies',
        through: { attributes: ['role'] }
      }],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return next(createError(404, 'Usuário não encontrado'));
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter o perfil do usuário atual
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Em ambiente de desenvolvimento, retornar o usuário simulado
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      });
    }
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return next(createError(404, 'Usuário não encontrado'));
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar o perfil do usuário atual
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(createError(404, 'Usuário não encontrado'));
    }
    
    // Atualizar os dados do usuário
    user.name = name || user.name;
    user.email = email || user.email;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todos os usuários (apenas admin)
 */
exports.listUsers = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(createError(403, 'Acesso negado'));
    }
    
    // Buscar todos os usuários
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar um novo usuário (apenas admin)
 */
exports.createUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(createError(403, 'Acesso negado'));
    }
    
    const { name, email, password, role } = req.body;
    
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(createError(409, 'Email já está em uso'));
    }
    
    // Criar o novo usuário
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar um usuário existente (apenas admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(createError(403, 'Acesso negado'));
    }
    
    const userId = req.params.id;
    const { name, email, role, isActive } = req.body;
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(createError(404, 'Usuário não encontrado'));
    }
    
    // Atualizar os dados do usuário
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Excluir um usuário (apenas admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(createError(403, 'Acesso negado'));
    }
    
    const userId = req.params.id;
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(createError(404, 'Usuário não encontrado'));
    }
    
    // Excluir o usuário
    await user.destroy();
    
    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { User, Company } = require('../models');
const bcrypt = require('bcrypt');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw createError(409, 'Este email já está registrado');
    }
    
    // Apenas superadmins podem criar outros superadmins
    if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
      throw createError(403, 'Sem permissão para criar usuário superadmin');
    }
    
    // Criar novo usuário
    const newUser = await User.create({
      name,
      email,
      password, // O hook beforeCreate no modelo fará o hash da senha
      role: role || 'user',
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Company,
        as: 'companies',
        through: { attributes: ['role'] }
      }]
    });
    
    if (!user) {
      throw createError(401, 'Credenciais inválidas');
    }
    
    // Verificar senha usando o método do modelo
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw createError(401, 'Credenciais inválidas');
    }
    
    // Atualizar último login
    await user.update({ lastLogin: new Date() });
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companies: user.companies,
      },
    });
  } catch (error) {
    next(error);
  }
};

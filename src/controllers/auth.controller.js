const jwt = require('jsonwebtoken');
const createError = require('http-errors');

// Usuários simulados para teste
const users = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    name: 'Usuário',
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  }
];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      throw createError(409, 'Este email já está registrado');
    }
    
    // Apenas superadmins podem criar outros superadmins
    if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
      throw createError(403, 'Sem permissão para criar usuário superadmin');
    }
    
    // Criar novo usuário simulado
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
      role: role || 'user',
    };
    
    users.push(newUser);
    
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
    const user = users.find(user => user.email === email);
    if (!user) {
      throw createError(401, 'Credenciais inválidas');
    }
    
    // Verificar senha
    if (user.password !== password) {
      throw createError(401, 'Credenciais inválidas');
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
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
      },
    });
  } catch (error) {
    next(error);
  }
};
#!/usr/bin/env node

/**
 * Script para testar a conexão com o banco de dados e verificar o login
 */

const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuração do banco de dados
const DB_HOST = '77.37.41.106';  // Endereço IP direto
const DB_PORT = 5432;
const DB_NAME = 'speedfunnels';
const DB_USER = 'postgres';
const DB_PASSWORD = 'Marcus1911!!Marcus';
const JWT_SECRET = 'aab33419d55426e0276078dd8b16eac990c163afab0f20645d976cd92c80eb96';

// Configurar conexão com o banco de dados
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

// Definir modelo de usuário para testes
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
  lastLogin: {
    type: Sequelize.DATE,
    field: 'last_login',
  },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Adicionar método para validar senha
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

async function testDatabaseConnection() {
  try {
    console.log('Testando conexão com o banco de dados...');
    console.log(`Host: ${DB_HOST}`);
    console.log(`Porta: ${DB_PORT}`);
    console.log(`Banco: ${DB_NAME}`);
    console.log(`Usuário: ${DB_USER}`);
    
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!\n');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

async function listUsers() {
  try {
    console.log('Listando usuários cadastrados:');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'lastLogin']
    });
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
    } else {
      console.log(`Total de usuários: ${users.length}`);
      users.forEach((user, index) => {
        console.log(`\nUsuário #${index + 1}:`);
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Função: ${user.role}`);
        console.log(`Último login: ${user.lastLogin || 'Nunca'}`);
      });
    }
    return users;
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return [];
  }
}

async function testLogin(email, password) {
  try {
    console.log(`\nTestando login para o usuário: ${email}`);
    
    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error('❌ Usuário não encontrado!');
      return false;
    }
    
    // Verificar senha
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.error('❌ Senha inválida!');
      return false;
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login bem-sucedido!');
    console.log('Detalhes do usuário:');
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Função: ${user.role}`);
    
    console.log('\nToken JWT gerado:');
    console.log(`${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('=== Teste de Conexão e Login ===\n');
    
    // Testar conexão com o banco de dados
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      return;
    }
    
    // Listar usuários
    const users = await listUsers();
    
    // Se tiver usuários, testar login com o administrador
    if (users.length > 0) {
      const adminUser = users.find(user => user.role === 'admin' || user.role === 'superadmin');
      
      if (adminUser) {
        console.log('\n=== Testando login com usuário administrador ===');
        await testLogin(adminUser.email, 'admin123'); // Senha padrão que usamos para criar o admin
      }
    }
    
    console.log('\n=== Testando login com credenciais específicas ===');
    await testLogin('admin@speedfunnels.online', 'admin123');
    
  } catch (error) {
    console.error('\n❌ Erro durante a execução do teste:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Executar a função principal
main();

#!/usr/bin/env node

/**
 * Script para verificar o usuário administrador no banco de dados
 * Este script verifica se o usuário admin existe e exibe suas informações
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME || 'speedfunnels',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Função para verificar a conexão com o banco de dados
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

// Função para verificar o usuário admin
async function checkAdminUser() {
  try {
    // Verificar se a tabela de usuários existe
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = results[0].exists;
    if (!tableExists) {
      console.error('A tabela de usuários não existe no banco de dados.');
      return;
    }
    
    // Buscar usuário admin
    const [users] = await sequelize.query(`
      SELECT id, name, email, password, role, created_at, last_login
      FROM users
      WHERE role IN ('superadmin', 'admin')
      ORDER BY id ASC;
    `);
    
    if (users.length === 0) {
      console.log('Nenhum usuário administrador encontrado no banco de dados.');
      return;
    }
    
    console.log(`Encontrados ${users.length} usuários administradores:`);
    users.forEach((user, index) => {
      console.log(`\nUsuário #${index + 1}:`);
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Função: ${user.role}`);
      console.log(`Criado em: ${user.created_at}`);
      console.log(`Último login: ${user.last_login || 'Nunca'}`);
    });
    
    // Verificar se o usuário admin@speedfunnels.com existe
    const adminUser = users.find(user => user.email === 'admin@speedfunnels.com');
    if (adminUser) {
      console.log('\nO usuário admin@speedfunnels.com existe no banco de dados.');
      console.log('Você pode fazer login com este usuário.');
    } else {
      console.log('\nO usuário admin@speedfunnels.com não existe no banco de dados.');
      console.log('Você pode criar este usuário usando o script create-admin-user.js.');
    }
    
  } catch (error) {
    console.error('Erro ao verificar usuário admin:', error.message);
  }
}

// Função principal
async function main() {
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await checkAdminUser();
  
  // Fechar a conexão
  await sequelize.close();
  console.log('\nVerificação concluída.');
}

// Executar a função principal
main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});

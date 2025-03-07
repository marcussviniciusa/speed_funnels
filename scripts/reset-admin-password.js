#!/usr/bin/env node

/**
 * Script para redefinir a senha do usuário administrador
 * Este script atualiza a senha do usuário admin@speedfunnels.com
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const readline = require('readline');

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

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Função para redefinir a senha do usuário admin
async function resetAdminPassword(newPassword) {
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
      return false;
    }
    
    // Buscar usuário admin
    const [users] = await sequelize.query(`
      SELECT id, name, email, role
      FROM users
      WHERE email = 'admin@speedfunnels.com';
    `);
    
    if (users.length === 0) {
      console.log('Usuário admin@speedfunnels.com não encontrado. Criando novo usuário...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Criar novo usuário admin
      await sequelize.query(`
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ('Administrador', 'admin@speedfunnels.com', :password, 'superadmin', NOW(), NOW());
      `, {
        replacements: { password: hashedPassword }
      });
      
      console.log('Novo usuário administrador criado com sucesso!');
      return true;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar a senha do usuário
    await sequelize.query(`
      UPDATE users
      SET password = :password, updated_at = NOW()
      WHERE email = 'admin@speedfunnels.com';
    `, {
      replacements: { password: hashedPassword }
    });
    
    console.log(`Senha do usuário ${users[0].name} (${users[0].email}) atualizada com sucesso!`);
    return true;
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  const connected = await testConnection();
  if (!connected) {
    rl.close();
    process.exit(1);
  }
  
  rl.question('Digite a nova senha para o usuário admin: ', async (password) => {
    if (!password || password.length < 6) {
      console.error('A senha deve ter pelo menos 6 caracteres.');
      rl.close();
      process.exit(1);
    }
    
    const success = await resetAdminPassword(password);
    
    if (success) {
      console.log('\nInstruções de login:');
      console.log('1. Acesse http://localhost:3000');
      console.log('2. Use as seguintes credenciais:');
      console.log('   - Email: admin@speedfunnels.com');
      console.log('   - Senha: [a senha que você acabou de definir]');
    }
    
    // Fechar a conexão
    await sequelize.close();
    rl.close();
  });
}

// Executar a função principal
main().catch(error => {
  console.error('Erro:', error);
  rl.close();
  process.exit(1);
});

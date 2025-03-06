#!/usr/bin/env node

/**
 * Script para criar um usuário administrador no sistema
 * Uso: node scripts/create-admin-user.js <nome> <email> <senha> <role>
 * Exemplo: node scripts/create-admin-user.js "Admin" "admin@example.com" "senha123" "admin"
 * 
 * Roles disponíveis: superadmin, admin, user
 */

const { sequelize, User } = require('../src/models');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    // Verificar argumentos
    const args = process.argv.slice(2);
    if (args.length < 3) {
      console.error('Uso: node scripts/create-admin-user.js <nome> <email> <senha> [role]');
      console.error('Exemplo: node scripts/create-admin-user.js "Admin" "admin@example.com" "senha123" "admin"');
      process.exit(1);
    }

    const name = args[0];
    const email = args[1];
    const password = args[2];
    const role = args[3] || 'admin'; // Default para admin se não especificado

    // Validar role
    if (!['superadmin', 'admin', 'user'].includes(role)) {
      console.error('Role inválida. Use: superadmin, admin ou user');
      process.exit(1);
    }

    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error(`Usuário com email ${email} já existe.`);
      process.exit(1);
    }

    // Criar o usuário
    console.log(`Criando usuário ${name} (${email}) com role ${role}...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      lastLogin: new Date()
    });

    console.log(`Usuário criado com sucesso! ID: ${user.id}`);
    console.log('Detalhes do usuário:');
    console.log(`  Nome: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log('\nVocê pode fazer login usando o email e senha fornecidos.');

  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    if (error.parent) {
      console.error('Erro do banco de dados:', error.parent.message);
    }
    process.exit(1);
  } finally {
    // Fechar a conexão com o banco de dados
    await sequelize.close();
    process.exit(0);
  }
}

// Executar o script
createAdminUser();

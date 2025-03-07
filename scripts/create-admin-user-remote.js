#!/usr/bin/env node

/**
 * Script para criar um usuário administrador no banco de dados remoto
 * Este script se conecta diretamente ao banco de dados PostgreSQL remoto
 * e cria um usuário administrador
 */

const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Configuração do banco de dados remoto
const DB_HOST = '77.37.41.106';
const DB_PORT = 5432;
const DB_NAME = 'speedfunnels';
const DB_USER = 'postgres';
const DB_PASSWORD = 'Marcus1911!!Marcus';

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Definir modelo de usuário
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  },
  last_login: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

// Função para criar o usuário administrador
async function createAdminUser(name, email, password, role) {
  try {
    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados remoto...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      console.log(`\nUsuário ${email} já existe no banco de dados.`);
      console.log('Detalhes do usuário:');
      console.log(`ID: ${existingUser.id}`);
      console.log(`Nome: ${existingUser.name}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      
      // Perguntar se deseja atualizar a senha
      rl.question('\nDeseja atualizar a senha deste usuário? (s/n): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
          // Hash da nova senha
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Atualizar senha
          await existingUser.update({ password: hashedPassword });
          console.log('Senha atualizada com sucesso!');
        } else {
          console.log('Operação cancelada. A senha não foi alterada.');
        }
        
        rl.close();
        await sequelize.close();
      });
      
      return;
    }
    
    // Criar novo usuário
    console.log(`Criando usuário ${name} (${email}) com role ${role}...`);
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário no banco de dados
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });
    
    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log('Detalhes do usuário:');
    console.log(`ID: ${newUser.id}`);
    console.log(`Nome: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    
    rl.close();
    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      console.error('\nNão foi possível conectar ao banco de dados remoto. Verifique:');
      console.error('1. Se o endereço IP e porta estão corretos');
      console.error('2. Se as credenciais estão corretas');
      console.error('3. Se o banco de dados está acessível pela rede');
      console.error('\nConfigurações utilizadas:');
      console.error(`Host: ${DB_HOST}`);
      console.error(`Porta: ${DB_PORT}`);
      console.error(`Banco: ${DB_NAME}`);
      console.error(`Usuário: ${DB_USER}`);
    }
    
    rl.close();
    await sequelize.close();
    process.exit(1);
  }
}

// Função principal
function main() {
  console.log('=== Criação de Usuário Administrador ===');
  console.log('Este script criará um usuário administrador no banco de dados remoto.');
  console.log(`Host do banco: ${DB_HOST}`);
  console.log(`Banco de dados: ${DB_NAME}`);
  
  // Definir valores padrão
  const defaultName = 'Administrador';
  const defaultEmail = 'admin@speedfunnels.com';
  const defaultRole = 'admin';
  
  rl.question(`\nNome (padrão: ${defaultName}): `, (name) => {
    const userName = name || defaultName;
    
    rl.question(`Email (padrão: ${defaultEmail}): `, (email) => {
      const userEmail = email || defaultEmail;
      
      rl.question('Senha: ', (password) => {
        if (!password) {
          console.error('A senha é obrigatória!');
          rl.close();
          return;
        }
        
        rl.question(`Role (padrão: ${defaultRole}, opções: superadmin, admin, user): `, (role) => {
          const userRole = role || defaultRole;
          
          if (!['superadmin', 'admin', 'user'].includes(userRole)) {
            console.error('Role inválida. Use: superadmin, admin ou user');
            rl.close();
            return;
          }
          
          // Confirmar dados
          console.log('\nDados do usuário:');
          console.log(`Nome: ${userName}`);
          console.log(`Email: ${userEmail}`);
          console.log(`Role: ${userRole}`);
          
          rl.question('\nConfirma a criação deste usuário? (s/n): ', (confirm) => {
            if (confirm.toLowerCase() === 's') {
              createAdminUser(userName, userEmail, password, userRole);
            } else {
              console.log('Operação cancelada.');
              rl.close();
            }
          });
        });
      });
    });
  });
}

// Executar a função principal
main();

#!/usr/bin/env node

/**
 * Script para verificar as permissões do usuário
 */

const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: '77.37.41.106',
  port: 5432,
  username: 'postgres',
  password: 'Marcus1911!!Marcus',
  database: 'speedfunnels',
  logging: console.log
});

async function checkUserPermissions() {
  try {
    console.log('=== Verificando permissões do usuário ===');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar usuário admin (ID 3)
    const [adminUser] = await sequelize.query(`
      SELECT * FROM users WHERE id = 3;
    `);
    
    console.log('\nDetalhes do usuário admin:');
    console.table(adminUser);
    
    // Verificar empresas
    const [companies] = await sequelize.query(`
      SELECT * FROM companies;
    `);
    
    console.log('\nEmpresas disponíveis:');
    console.table(companies);
    
    // Verificar relações entre usuários e empresas
    const [userCompanies] = await sequelize.query(`
      SELECT uc.*, u.name as user_name, u.email as user_email, c.name as company_name
      FROM user_companies uc
      JOIN users u ON uc.user_id = u.id
      JOIN companies c ON uc.company_id = c.id;
    `);
    
    console.log('\nRelações entre usuários e empresas:');
    console.table(userCompanies);
    
    // Se não houver relações, vamos criar uma para o usuário admin
    if (userCompanies.length === 0) {
      console.log('\nNão há relações entre usuários e empresas. Criando uma para o usuário admin...');
      
      // Verificar se existe a empresa com ID 1
      if (companies.length === 0) {
        console.log('\nNão há empresas cadastradas. Criando uma empresa padrão...');
        
        await sequelize.query(`
          INSERT INTO companies (name, created_at, updated_at)
          VALUES ('Minha Empresa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `);
        
        console.log('✅ Empresa padrão criada com sucesso!');
      }
      
      // Criar relação entre usuário admin e empresa
      await sequelize.query(`
        INSERT INTO user_companies (user_id, company_id, role, created_at, updated_at)
        VALUES (3, 1, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
      
      console.log('✅ Relação entre usuário admin e empresa criada com sucesso!');
      
      // Verificar relações novamente
      const [updatedUserCompanies] = await sequelize.query(`
        SELECT uc.*, u.name as user_name, u.email as user_email, c.name as company_name
        FROM user_companies uc
        JOIN users u ON uc.user_id = u.id
        JOIN companies c ON uc.company_id = c.id;
      `);
      
      console.log('\nRelações atualizadas entre usuários e empresas:');
      console.table(updatedUserCompanies);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões do usuário:', error);
  } finally {
    // Fechar a conexão
    await sequelize.close();
    console.log('\n=== Verificação concluída ===');
  }
}

// Executar a função
checkUserPermissions();

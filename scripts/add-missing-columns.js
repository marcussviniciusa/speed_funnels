#!/usr/bin/env node

/**
 * Script para adicionar colunas faltantes à tabela user_companies
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

async function addMissingColumns() {
  try {
    console.log('=== Adicionando colunas faltantes à tabela user_companies ===');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar se a coluna created_at existe
    const [createdAtExists] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_companies' AND column_name = 'created_at';
    `);
    
    // Verificar se a coluna updated_at existe
    const [updatedAtExists] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_companies' AND column_name = 'updated_at';
    `);
    
    // Adicionar coluna created_at se não existir
    if (createdAtExists.length === 0) {
      console.log('\nAdicionando coluna created_at...');
      await sequelize.query(`
        ALTER TABLE user_companies 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Coluna created_at adicionada com sucesso!');
    } else {
      console.log('\n✅ Coluna created_at já existe.');
    }
    
    // Adicionar coluna updated_at se não existir
    if (updatedAtExists.length === 0) {
      console.log('\nAdicionando coluna updated_at...');
      await sequelize.query(`
        ALTER TABLE user_companies 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Coluna updated_at adicionada com sucesso!');
    } else {
      console.log('\n✅ Coluna updated_at já existe.');
    }
    
    // Verificar a estrutura atualizada da tabela
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_companies'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nEstrutura atualizada da tabela user_companies:');
    console.table(results);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas faltantes:', error);
  } finally {
    // Fechar a conexão
    await sequelize.close();
    console.log('\n=== Operação concluída ===');
  }
}

// Executar a função
addMissingColumns();

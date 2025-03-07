#!/usr/bin/env node

/**
 * Script para verificar a estrutura da tabela user_companies
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

async function checkTableStructure() {
  try {
    console.log('=== Verificando estrutura da tabela user_companies ===');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Consultar informações sobre a tabela
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_companies'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nEstrutura da tabela user_companies:');
    console.table(results);
    
    // Verificar se existem registros na tabela
    const [count] = await sequelize.query('SELECT COUNT(*) FROM user_companies;');
    console.log(`\nTotal de registros na tabela: ${count[0].count}`);
    
    // Se houver registros, mostrar alguns exemplos
    if (parseInt(count[0].count) > 0) {
      const [samples] = await sequelize.query('SELECT * FROM user_companies LIMIT 5;');
      console.log('\nExemplos de registros:');
      console.table(samples);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar a estrutura da tabela:', error);
  } finally {
    // Fechar a conexão
    await sequelize.close();
    console.log('\n=== Verificação concluída ===');
  }
}

// Executar a função
checkTableStructure();

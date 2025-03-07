#!/usr/bin/env node

/**
 * Script para listar todas as tabelas no banco de dados
 */

const { Sequelize } = require('sequelize');

// Configuração do banco de dados remoto
const DB_HOST = '77.37.41.106';
const DB_PORT = 5432;
const DB_NAME = 'speedfunnels';
const DB_USER = 'postgres';
const DB_PASSWORD = 'Marcus1911!!Marcus';

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

async function listTables() {
  try {
    console.log('Conectando ao banco de dados remoto...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.\n');
    
    console.log('Listando tabelas do banco de dados:');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (results.length === 0) {
      console.log('Nenhuma tabela encontrada no banco de dados.');
    } else {
      console.log(`Total de tabelas: ${results.length}`);
      console.log('Tabelas:');
      results.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      
      // Verificar estrutura da tabela de usuários, se existir
      const userTable = results.find(row => 
        row.table_name === 'users' || 
        row.table_name === 'Users'
      );
      
      if (userTable) {
        console.log(`\nEstrutura da tabela ${userTable.table_name}:`);
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${userTable.table_name}'
          ORDER BY ordinal_position
        `);
        
        columns.forEach(col => {
          console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
      }
    }
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
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
  } finally {
    await sequelize.close();
  }
}

// Executar a função principal
listTables();

const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

// Constantes
const MIGRATION_TABLE = 'migrations';

/**
 * Verifica se a tabela de migrações existe
 */
async function checkMigrationTable() {
  try {
    // Verifica se a tabela migrations existe
    const result = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = '${MIGRATION_TABLE}'
      )`,
      { type: QueryTypes.SELECT }
    );
    
    return result[0].exists;
  } catch (error) {
    logger.error('Erro ao verificar tabela de migrações:', error);
    return false;
  }
}

/**
 * Cria a tabela de migrações
 */
async function createMigrationTable() {
  try {
    await sequelize.query(`
      CREATE TABLE ${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Tabela de migrações criada com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao criar tabela de migrações:', error);
    return false;
  }
}

/**
 * Verifica quais migrações já foram aplicadas
 */
async function getAppliedMigrations() {
  try {
    const migrations = await sequelize.query(
      `SELECT name FROM ${MIGRATION_TABLE} ORDER BY applied_at`,
      { type: QueryTypes.SELECT }
    );
    return migrations.map(m => m.name);
  } catch (error) {
    logger.error('Erro ao obter migrações aplicadas:', error);
    return [];
  }
}

/**
 * Registra uma migração como aplicada
 */
async function registerMigration(name) {
  try {
    await sequelize.query(
      `INSERT INTO ${MIGRATION_TABLE} (name) VALUES (:name)`,
      {
        replacements: { name },
        type: QueryTypes.INSERT
      }
    );
    logger.info(`Migração ${name} registrada com sucesso`);
    return true;
  } catch (error) {
    logger.error(`Erro ao registrar migração ${name}:`, error);
    return false;
  }
}

/**
 * Executa o conteúdo de um script SQL
 */
async function executeSqlScript(scriptContent, migrationName) {
  try {
    // Executa o script SQL em uma transação
    await sequelize.transaction(async transaction => {
      await sequelize.query(scriptContent, { transaction });
      await registerMigration(migrationName);
    });
    
    return true;
  } catch (error) {
    logger.error(`Erro ao executar script SQL para migração ${migrationName}:`, error);
    return false;
  }
}

/**
 * Roda todas as migrações pendentes
 */
async function runMigrations() {
  try {
    logger.info('Iniciando processo de migração do banco de dados...');
    
    // Verificar e criar tabela de migrações se necessário
    const migrationTableExists = await checkMigrationTable();
    if (!migrationTableExists) {
      const tableCreated = await createMigrationTable();
      if (!tableCreated) {
        logger.error('Não foi possível criar a tabela de migrações. Abortando.');
        return false;
      }
    }
    
    // Obter migrações já aplicadas
    const appliedMigrations = await getAppliedMigrations();
    logger.info(`Migrações já aplicadas: ${appliedMigrations.length}`);
    
    // Carregar scripts SQL do diretório de banco de dados
    const dbDirectory = path.join(__dirname, '../../database');
    const sqlFiles = fs.readdirSync(dbDirectory)
                      .filter(file => file.endsWith('.sql'))
                      .sort(); // Ordenar para garantir execução na ordem correta
    
    // Executar migrações pendentes
    let appliedCount = 0;
    for (const sqlFile of sqlFiles) {
      const migrationName = sqlFile;
      
      // Pular migrações já aplicadas
      if (appliedMigrations.includes(migrationName)) {
        logger.info(`Migração ${migrationName} já aplicada, pulando...`);
        continue;
      }
      
      logger.info(`Aplicando migração: ${migrationName}`);
      
      // Ler conteúdo do script SQL
      const scriptPath = path.join(dbDirectory, sqlFile);
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // Executar script
      const success = await executeSqlScript(scriptContent, migrationName);
      if (success) {
        logger.info(`Migração ${migrationName} aplicada com sucesso`);
        appliedCount++;
      } else {
        logger.error(`Falha ao aplicar migração ${migrationName}`);
        // Continuar com outras migrações mesmo se uma falhar
      }
    }
    
    logger.info(`Migrações concluídas. ${appliedCount} de ${sqlFiles.length - appliedMigrations.length} migrações aplicadas.`);
    return true;
  } catch (error) {
    logger.error('Erro durante o processo de migração:', error);
    return false;
  }
}

module.exports = {
  runMigrations
};

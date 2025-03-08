const metaService = require('../services/metaService');
const logger = require('../utils/logger');
const cron = require('node-cron');

// Intervalo de sincronização padrão (a cada 1 minuto para simular tempo real)
const SYNC_INTERVAL = process.env.META_SYNC_INTERVAL ? 
  (process.env.META_SYNC_INTERVAL === 'realtime' ? '* * * * *' : `*/${process.env.META_SYNC_INTERVAL} * * * *`) :
  '* * * * *'; // Por padrão, sincroniza a cada minuto

// Flag para indicar se está executando em modo de tempo real
const isRealtimeMode = process.env.META_SYNC_INTERVAL === 'realtime';

/**
 * Executa a sincronização de dados do Meta
 * @param {boolean} isManualSync - Indica se é uma sincronização manual
 */
async function runMetaDataSync(isManualSync = false) {
  const logLevel = isManualSync || !isRealtimeMode ? 'info' : 'debug';
  logger[logLevel](`Iniciando sincronização ${isManualSync ? 'manual' : 'programada'} de dados do Meta`);
  
  try {
    const result = await metaService.syncAllActiveConnections();
    
    logger[logLevel](`Sincronização concluída. Processadas ${result.totalProcessed} conexões.`);
    
    // Registrar erros, se houver
    if (result.results) {
      const failedConnections = result.results.filter(r => !r.success);
      if (failedConnections.length > 0) {
        logger.warn(`Falha na sincronização de ${failedConnections.length} conexões.`);
        failedConnections.forEach(fc => {
          logger.error(`Falha na conexão ${fc.connectionId} (${fc.accountId}): ${fc.error}`);
        });
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Erro ao executar job de sincronização do Meta:', error);
    return { success: false, error: error.message };
  }
}

// Armazenar referência à tarefa para poder ajustá-la posteriormente
let syncTask = null;

/**
 * Inicializa o job de sincronização do Meta
 * @returns {boolean} Indica se a inicialização foi bem-sucedida
 */
function initialize() {
  const mode = isRealtimeMode ? 'TEMPO REAL' : `intervalo de ${process.env.META_SYNC_INTERVAL || 1} minuto(s)`;
  logger.info(`Configurando job de sincronização do Meta em modo: ${mode} (${SYNC_INTERVAL})`);
  
  // Verificar se o cron pattern é válido
  if (!cron.validate(SYNC_INTERVAL)) {
    logger.error(`Intervalo de sincronização inválido: ${SYNC_INTERVAL}`);
    return false;
  }
  
  // Agendar a tarefa usando node-cron
  syncTask = cron.schedule(SYNC_INTERVAL, async () => {
    await runMetaDataSync();
  });
  
  // Iniciar a tarefa
  syncTask.start();
  
  logger.info(`Job de sincronização do Meta inicializado com sucesso em modo ${mode}`);
  
  return true;
}

/**
 * Altera o modo de sincronização para tempo real ou intervalo personalizado
 * @param {string} mode - 'realtime' para tempo real ou número de minutos
 * @returns {boolean} Indica se a alteração foi bem-sucedida
 */
function changeSyncMode(mode) {
  try {
    // Parar a tarefa atual se existir
    if (syncTask) {
      syncTask.stop();
    }
    
    // Configurar novo intervalo
    let newInterval;
    if (mode === 'realtime') {
      newInterval = '* * * * *'; // A cada minuto
      logger.info('Alterando para modo de sincronização em TEMPO REAL');
    } else {
      const minutes = parseInt(mode);
      if (isNaN(minutes) || minutes < 1) {
        logger.error(`Intervalo inválido: ${mode}`);
        return false;
      }
      newInterval = `*/${minutes} * * * *`;
      logger.info(`Alterando para sincronização a cada ${minutes} minuto(s)`);
    }
    
    // Criar e iniciar nova tarefa
    syncTask = cron.schedule(newInterval, async () => {
      await runMetaDataSync();
    });
    
    syncTask.start();
    logger.info('Modo de sincronização alterado com sucesso');
    
    return true;
  } catch (error) {
    logger.error('Erro ao alterar modo de sincronização:', error);
    return false;
  }
}

/**
 * Executa uma sincronização manual imediata
 * @param {number} connectionId - ID opcional da conexão específica a ser sincronizada
 * @param {number} companyId - ID opcional da empresa a ter suas conexões sincronizadas
 * @returns {Promise<Object>} Resultado da sincronização
 */
async function runManualSync(connectionId = null, companyId = null) {
  logger.info('Executando sincronização manual de dados do Meta');
  
  if (connectionId) {
    logger.info(`Sincronizando apenas a conexão ID: ${connectionId}`);
    return await metaService.syncConnectionData(connectionId);
  } else if (companyId) {
    logger.info(`Sincronizando conexões da empresa ID: ${companyId}`);
    return await metaService.syncCompanyConnections(companyId);
  } else {
    return await runMetaDataSync(true);
  }
}

module.exports = {
  initialize,
  runManualSync,
  runMetaDataSync,
  changeSyncMode
};

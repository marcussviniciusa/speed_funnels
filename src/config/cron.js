const cron = require('node-cron');
const { processSchedules } = require('../jobs/reportScheduler');
const metaDataSync = require('../jobs/metaDataSync');

// Inicializar cron jobs
const initCronJobs = () => {
  // Verificar e processar agendamentos a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('Executando verificação programada de agendamentos de relatórios');
    try {
      await processSchedules();
    } catch (error) {
      console.error('Erro durante a execução programada:', error);
    }
  });
  
  // Inicializar job de sincronização de dados do Meta
  try {
    const metaSyncInitialized = metaDataSync.initialize();
    if (metaSyncInitialized) {
      console.log('Job de sincronização de dados do Meta inicializado com sucesso');
    } else {
      console.error('Falha ao inicializar job de sincronização de dados do Meta');
    }
  } catch (error) {
    console.error('Erro ao inicializar job de sincronização do Meta:', error);
  }
  
  // Executar uma sincronização inicial após 1 minuto do início do servidor
  setTimeout(async () => {
    try {
      console.log('Executando sincronização inicial de dados do Meta');
      await metaDataSync.runMetaDataSync();
    } catch (error) {
      console.error('Erro durante a sincronização inicial de dados do Meta:', error);
    }
  }, 60000);
  
  console.log('Cron jobs configurados com sucesso');
};

module.exports = {
  initCronJobs
}; 
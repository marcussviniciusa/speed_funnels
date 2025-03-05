const cron = require('node-cron');
const { processSchedules } = require('../jobs/reportScheduler');

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
  
  console.log('Cron jobs configurados com sucesso');
};

module.exports = {
  initCronJobs
}; 
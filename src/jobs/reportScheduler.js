const { ScheduledReport, Report, Company } = require('../models');
const { Op } = require('sequelize');
const { addDays, addWeeks, addMonths } = require('date-fns');
const emailService = require('../services/emailService');
const reportService = require('../services/reportService');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');

// Processar agendamentos pendentes
const processSchedules = async () => {
  try {
    console.log('Iniciando processamento de agendamentos de relatórios...');
    
    // Buscar agendamentos pendentes (nextRun <= agora e isActive = true)
    const now = new Date();
    const pendingSchedules = await ScheduledReport.findAll({
      where: {
        nextRun: { [Op.lte]: now },
        isActive: true
      },
      include: [
        {
          model: Report,
          as: 'report',
          include: [{ model: Company, as: 'company' }]
        }
      ]
    });
    
    console.log(`Encontrados ${pendingSchedules.length} agendamentos pendentes.`);
    
    // Processar cada agendamento
    for (const schedule of pendingSchedules) {
      try {
        console.log(`Processando agendamento #${schedule.id} para relatório "${schedule.report.name}"`);
        
        // Gerar relatório
        const reportData = await reportService.generateReport(
          schedule.report.id,
          {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            endDate: new Date()
          }
        );
        
        // Gerar PDF do relatório 
        const pdfBuffer = await reportService.generateReportPdf(reportData);
        
        // Criar link público temporário para o relatório
        const publicLink = await createTempPublicLink(schedule.report.id);
        
        // Enviar email para cada destinatário
        for (const recipient of schedule.recipients) {
          try {
            // Salvar arquivo temporário para anexo
            const tempFileName = `relatorio_${schedule.report.id}_${Date.now()}.pdf`;
            const tempFilePath = path.join(process.env.TEMP_FOLDER || '/tmp', tempFileName);
            await fs.writeFile(tempFilePath, pdfBuffer);
            
            await emailService.sendReportEmail({
              to: recipient,
              subject: `Relatório: ${schedule.report.name}`,
              reportName: schedule.report.name,
              companyName: schedule.report.company.name,
              reportDate: new Date().toLocaleDateString('pt-BR'),
              reportLink: `${process.env.FRONTEND_URL}/report/${publicLink}`,
              attachments: [
                {
                  filename: `Relatório - ${schedule.report.name}.pdf`,
                  path: tempFilePath
                }
              ]
            });
            
            // Remover arquivo temporário após envio
            await fs.unlink(tempFilePath);
            
          } catch (emailError) {
            console.error(`Erro ao enviar email para ${recipient}:`, emailError);
            // Continuar com os próximos destinatários mesmo em caso de erro
          }
        }
        
        // Calcular a próxima execução com base na frequência
        const nextRun = calculateNextRun(schedule);
        
        // Atualizar o agendamento
        await schedule.update({
          lastRun: now,
          nextRun
        });
        
        console.log(`Agendamento #${schedule.id} processado com sucesso. Próxima execução: ${nextRun}`);
        
      } catch (scheduleError) {
        console.error(`Erro ao processar agendamento #${schedule.id}:`, scheduleError);
        // Continuar com os próximos agendamentos mesmo em caso de erro
      }
    }
    
    console.log('Processamento de agendamentos concluído.');
    
  } catch (error) {
    console.error('Erro durante o processamento de agendamentos:', error);
  }
};

// Função para calcular a próxima execução do agendamento
const calculateNextRun = (schedule) => {
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (schedule.frequency) {
    case 'daily':
      nextRun = addDays(nextRun, 1);
      break;
    case 'weekly':
      const dayOfWeek = schedule.config?.dayOfWeek || 1;
      const currentDay = now.getDay();
      const daysToAdd = (dayOfWeek + 7 - currentDay) % 7;
      nextRun = addDays(nextRun, daysToAdd || 7);
      break;
    case 'monthly':
      const dayOfMonth = schedule.config?.dayOfMonth || 1;
      nextRun = addMonths(nextRun, 1);
      const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
      nextRun.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      break;
    default:
      nextRun = addDays(nextRun, 1);
  }
  
  // Definir horário para 6h da manhã
  nextRun.setHours(6, 0, 0, 0);
  
  return nextRun;
};

// Função para criar um link público temporário para um relatório
const createTempPublicLink = async (reportId) => {
  try {
    // Criar link com expiração de 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Gerar ID público único
    const publicId = crypto.randomBytes(32).toString('hex');
    
    // Criar registro de link público
    const { PublicReportLink, Report } = require('../models');
    const link = await PublicReportLink.create({
      reportId,
      publicId,
      expiresAt,
      isActive: true,
      createdBy: null // Sistema
    });
    
    return publicId;
  } catch (error) {
    console.error('Erro ao criar link público temporário:', error);
    throw error;
  }
};

// Executar o processamento quando chamado diretamente
if (require.main === module) {
  console.log('Iniciando job de processamento de agendamentos como processo independente');
  processSchedules()
    .then(() => {
      console.log('Job de agendamentos concluído');
      process.exit(0);
    })
    .catch(err => {
      console.error('Erro fatal durante execução do job:', err);
      process.exit(1);
    });
} else {
  // Exportar para uso como módulo
  module.exports = {
    processSchedules
  };
}

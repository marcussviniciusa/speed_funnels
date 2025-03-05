const { Report, ScheduledReport, User, Company } = require('../models');
const createError = require('http-errors');
const { addDays, addWeeks, addMonths, format } = require('date-fns');
const emailService = require('../services/emailService');

// Criar novo agendamento de relatório
exports.createSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reportId, frequency, recipients, dayOfWeek, dayOfMonth } = req.body;
    
    if (!reportId || !frequency || !recipients || recipients.length === 0) {
      throw createError(400, 'Dados incompletos para criar agendamento');
    }
    
    // Verificar se o relatório existe e pertence à mesma empresa do usuário
    const report = await Report.findOne({
      where: { id: reportId },
      include: [{ model: Company, as: 'company' }]
    });
    
    if (!report) {
      throw createError(404, 'Relatório não encontrado');
    }
    
    if (report.companyId !== req.user.companyId) {
      throw createError(403, 'Você não tem permissão para agendar este relatório');
    }
    
    // Validar emails dos destinatários
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      throw createError(400, `Emails inválidos: ${invalidEmails.join(', ')}`);
    }
    
    // Calcular próxima execução com base na frequência
    let nextRun = new Date();
    
    switch (frequency) {
      case 'daily':
        nextRun = addDays(nextRun, 1);
        nextRun.setHours(6, 0, 0, 0); // Executar às 6h da manhã
        break;
      case 'weekly':
        // Se dayOfWeek for fornecido (0-6, domingo-sábado), usar para calcular próxima data
        if (dayOfWeek !== undefined && dayOfWeek >= 0 && dayOfWeek <= 6) {
          const currentDay = nextRun.getDay();
          const daysToAdd = (dayOfWeek + 7 - currentDay) % 7;
          nextRun = addDays(nextRun, daysToAdd || 7);
        } else {
          nextRun = addWeeks(nextRun, 1);
        }
        nextRun.setHours(6, 0, 0, 0);
        break;
      case 'monthly':
        // Se dayOfMonth for fornecido (1-31), usar para calcular próxima data
        if (dayOfMonth !== undefined && dayOfMonth >= 1 && dayOfMonth <= 31) {
          nextRun = addMonths(nextRun, 1);
          // Ajustar para o dia do mês especificado
          const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
          nextRun.setDate(Math.min(dayOfMonth, lastDayOfMonth));
        } else {
          nextRun = addMonths(nextRun, 1);
        }
        nextRun.setHours(6, 0, 0, 0);
        break;
      default:
        throw createError(400, 'Frequência de agendamento inválida');
    }
    
    // Criar agendamento
    const schedule = await ScheduledReport.create({
      reportId,
      frequency,
      recipients,
      nextRun,
      createdBy: userId,
      isActive: true,
      config: {
        dayOfWeek: frequency === 'weekly' ? (dayOfWeek || 1) : null,
        dayOfMonth: frequency === 'monthly' ? (dayOfMonth || 1) : null,
      }
    });
    
    res.status(201).json({
      success: true,
      schedule: {
        id: schedule.id,
        reportId: schedule.reportId,
        frequency: schedule.frequency,
        recipients: schedule.recipients,
        nextRun: schedule.nextRun,
        isActive: schedule.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Listar agendamentos para um relatório
exports.listSchedules = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // Verificar se o relatório existe e pertence à mesma empresa do usuário
    const report = await Report.findOne({
      where: { id: reportId, companyId: req.user.companyId }
    });
    
    if (!report) {
      throw createError(404, 'Relatório não encontrado');
    }
    
    // Buscar agendamentos
    const schedules = await ScheduledReport.findAll({
      where: { reportId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        frequency: schedule.frequency,
        recipients: schedule.recipients,
        nextRun: schedule.nextRun,
        lastRun: schedule.lastRun,
        isActive: schedule.isActive,
        createdBy: schedule.creator,
        createdAt: schedule.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar um agendamento
exports.updateSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { frequency, recipients, isActive, dayOfWeek, dayOfMonth } = req.body;
    
    // Buscar agendamento
    const schedule = await ScheduledReport.findOne({
      where: { id: scheduleId },
      include: [
        {
          model: Report,
          as: 'report',
          where: { companyId: req.user.companyId },
          required: true
        }
      ]
    });
    
    if (!schedule) {
      throw createError(404, 'Agendamento não encontrado ou sem permissão');
    }
    
    // Preparar dados para atualização
    const updateData = {};
    
    if (frequency) {
      updateData.frequency = frequency;
      
      // Recalcular próxima execução
      let nextRun = new Date();
      
      switch (frequency) {
        case 'daily':
          nextRun = addDays(nextRun, 1);
          nextRun.setHours(6, 0, 0, 0);
          break;
        case 'weekly':
          const dayToUse = dayOfWeek !== undefined ? dayOfWeek : (schedule.config?.dayOfWeek || 1);
          const currentDay = nextRun.getDay();
          const daysToAdd = (dayToUse + 7 - currentDay) % 7;
          nextRun = addDays(nextRun, daysToAdd || 7);
          nextRun.setHours(6, 0, 0, 0);
          break;
        case 'monthly':
          const dateToUse = dayOfMonth !== undefined ? dayOfMonth : (schedule.config?.dayOfMonth || 1);
          nextRun = addMonths(nextRun, 1);
          const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
          nextRun.setDate(Math.min(dateToUse, lastDayOfMonth));
          nextRun.setHours(6, 0, 0, 0);
          break;
      }
      
      updateData.nextRun = nextRun;
      updateData.config = {
        ...schedule.config,
        dayOfWeek: frequency === 'weekly' ? (dayOfWeek !== undefined ? dayOfWeek : schedule.config?.dayOfWeek) : null,
        dayOfMonth: frequency === 'monthly' ? (dayOfMonth !== undefined ? dayOfMonth : schedule.config?.dayOfMonth) : null
      };
    }
    
    if (recipients && recipients.length > 0) {
      // Validar emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        throw createError(400, `Emails inválidos: ${invalidEmails.join(', ')}`);
      }
      
      updateData.recipients = recipients;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    // Atualizar agendamento
    await schedule.update(updateData);
    
    res.json({
      success: true,
      message: 'Agendamento atualizado com sucesso',
      schedule: {
        id: schedule.id,
        frequency: schedule.frequency,
        recipients: schedule.recipients,
        nextRun: schedule.nextRun,
        isActive: schedule.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Excluir um agendamento
exports.deleteSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    
    // Buscar agendamento
    const schedule = await ScheduledReport.findOne({
      where: { id: scheduleId },
      include: [
        {
          model: Report,
          as: 'report',
          where: { companyId: req.user.companyId },
          required: true
        }
      ]
    });
    
    if (!schedule) {
      throw createError(404, 'Agendamento não encontrado ou sem permissão');
    }
    
    // Excluir agendamento
    await schedule.destroy();
    
    res.json({
      success: true,
      message: 'Agendamento excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Executar um agendamento manualmente (para testes)
exports.runScheduleManually = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    
    // Buscar agendamento
    const schedule = await ScheduledReport.findOne({
      where: { id: scheduleId },
      include: [
        {
          model: Report,
          as: 'report',
          where: { companyId: req.user.companyId },
          include: [{ model: Company, as: 'company' }],
          required: true
        }
      ]
    });
    
    if (!schedule) {
      throw createError(404, 'Agendamento não encontrado ou sem permissão');
    }
    
    // Simular o envio do relatório
    try {
      // Buscar dados do relatório
      // Na implementação real, você geraria o relatório e enviaria como anexo ou link
      const reportName = schedule.report.name;
      const companyName = schedule.report.company.name;
      
      // Enviar email para cada destinatário
      for (const recipient of schedule.recipients) {
        await emailService.sendReportEmail({
          to: recipient,
          subject: `Relatório: ${reportName}`,
          reportName,
          companyName,
          reportDate: format(new Date(), 'dd/MM/yyyy'),
          reportLink: `https://seusistema.com/report-preview/${schedule.report.id}?token=abc123`, // Link de exemplo
        });
      }
      
      // Atualizar último envio
      await schedule.update({
        lastRun: new Date()
      });
      
      res.json({
        success: true,
        message: `Relatório enviado com sucesso para ${schedule.recipients.length} destinatários`
      });
    } catch (emailError) {
      console.error('Erro ao enviar emails:', emailError);
      throw createError(500, 'Erro ao enviar emails do relatório');
    }
  } catch (error) {
    next(error);
  }
}; 
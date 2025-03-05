const createError = require('http-errors');
const reportService = require('../services/reportService');

// Dados do dashboard para Meta Ads
exports.getMetaDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw createError(400, 'É necessário fornecer datas de início e fim');
    }
    
    // Gerar dados simulados para teste
    const mockData = reportService.generateMockData({
      startDate,
      endDate,
      platform: 'meta'
    });
    
    res.json({
      success: true,
      data: mockData.platforms.meta
    });
  } catch (error) {
    next(error);
  }
};

// Dados do dashboard para Google Analytics
exports.getGoogleDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw createError(400, 'É necessário fornecer datas de início e fim');
    }
    
    // Gerar dados simulados para teste
    const mockData = reportService.generateMockData({
      startDate,
      endDate,
      platform: 'google'
    });
    
    res.json({
      success: true,
      data: mockData.platforms.google
    });
  } catch (error) {
    next(error);
  }
};

// Criar um novo relatório personalizado
exports.createReport = async (req, res, next) => {
  try {
    const { name, description, config, platforms } = req.body;
    
    if (!name || !config || !platforms) {
      throw createError(400, 'Dados incompletos para criar relatório');
    }
    
    res.status(201).json({
      success: true,
      message: 'Relatório criado com sucesso',
      report: {
        id: Math.floor(Math.random() * 1000),
        name,
        description,
        config,
        platforms,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Listar relatórios da empresa
exports.listReports = async (req, res, next) => {
  try {
    // Dados simulados para teste
    const reports = [
      {
        id: 1,
        name: 'Relatório de Desempenho de Campanhas',
        description: 'Análise de desempenho das campanhas do Meta Ads',
        platforms: ['meta'],
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { id: 1, name: 'Admin' },
        publicLinks: []
      },
      {
        id: 2,
        name: 'Análise de Tráfego do Site',
        description: 'Visão geral do tráfego do site via Google Analytics',
        platforms: ['google'],
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { id: 1, name: 'Admin' },
        publicLinks: [
          { id: 1, publicId: 'abc123', isActive: true, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        ]
      }
    ];
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// Obter detalhes de um relatório específico
exports.getReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // Dados simulados para teste
    const report = {
      id: parseInt(reportId),
      name: 'Relatório de Teste',
      description: 'Descrição do relatório de teste',
      config: {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        metrics: { meta: ['spend', 'impressions', 'clicks'], google: ['sessions', 'users'] },
        dimensions: { google: ['source', 'medium'] },
        platforms: ['meta', 'google']
      },
      platforms: ['meta', 'google'],
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: { id: 1, name: 'Admin' },
      publicLinks: []
    };
    
    // Gerar dados simulados
    const reportData = reportService.generateMockData(report.config);
    
    res.json({
      success: true,
      report,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar um relatório
exports.updateReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { name, description, config, platforms } = req.body;
    
    res.json({
      success: true,
      message: 'Relatório atualizado com sucesso',
      report: {
        id: parseInt(reportId),
        name,
        description,
        config,
        platforms,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Excluir um relatório
exports.deleteReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    res.json({
      success: true,
      message: 'Relatório excluído com sucesso',
      reportId: parseInt(reportId)
    });
  } catch (error) {
    next(error);
  }
};

// Criar link público para compartilhamento
exports.createPublicLink = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { expiresIn } = req.body;
    
    const publicId = Math.random().toString(36).substring(2, 15);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null;
    
    res.json({
      success: true,
      message: 'Link público criado com sucesso',
      publicLink: {
        id: Math.floor(Math.random() * 1000),
        reportId: parseInt(reportId),
        publicId,
        isActive: true,
        expiresAt,
        createdAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obter dados para um relatório público
exports.getPublicReport = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    // Dados simulados
    const report = {
      id: 1,
      name: 'Relatório Público',
      description: 'Relatório compartilhado publicamente',
      config: {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        metrics: { meta: ['spend', 'impressions', 'clicks'], google: ['sessions', 'users'] },
        dimensions: { google: ['source', 'medium'] },
        platforms: ['meta', 'google']
      },
      company: {
        name: 'Empresa Teste',
        logoUrl: 'https://via.placeholder.com/150',
        primaryColor: '#2196f3',
        secondaryColor: '#f50057'
      }
    };
    
    // Gerar dados simulados
    const reportData = reportService.generateMockData(report.config);
    
    res.json({
      success: true,
      report,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};
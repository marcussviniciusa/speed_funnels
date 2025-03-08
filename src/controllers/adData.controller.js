const { AdData, ApiConnection, Company } = require('../models');
const metaService = require('../services/metaService');
const metaDataSync = require('../jobs/metaDataSync');
const { Op, Sequelize } = require('sequelize');

/**
 * Obter dados de anúncios por empresa
 */
exports.getAdDataByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, level = 'ad', limit = 100, offset = 0 } = req.query;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Construir condições de consulta
    const whereConditions = {
      companyId: companyId
    };

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Aplicar filtro por nível (campanha, adset, ad)
    if (level === 'campaign') {
      whereConditions.campaignId = { [Op.not]: null };
      whereConditions.adsetId = null;
      whereConditions.adId = null;
    } else if (level === 'adset') {
      whereConditions.adsetId = { [Op.not]: null };
      whereConditions.adId = null;
    } else if (level === 'ad') {
      whereConditions.adId = { [Op.not]: null };
    }

    // Buscar dados
    const data = await AdData.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastSyncedAt', 'DESC']],
      attributes: { exclude: ['rawData'] } // Excluir o campo rawData para reduzir o tamanho da resposta
    });

    return res.json({
      success: true,
      count: data.count,
      data: data.rows,
      pagination: {
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados de anúncios:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dados de anúncios',
      error: error.message 
    });
  }
};

/**
 * Obter dados de anúncios por conexão
 */
exports.getAdDataByConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { startDate, endDate, level = 'ad', limit = 100, offset = 0 } = req.query;

    // Buscar a conexão para verificar acesso
    const connection = await ApiConnection.findByPk(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Conexão não encontrada' });
    }

    // Verificar acesso à empresa da conexão
    if (!await hasCompanyAccess(req.user.id, connection.companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta conexão' });
    }

    // Construir condições de consulta
    const whereConditions = {
      connectionId: connectionId
    };

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Aplicar filtro por nível (campanha, adset, ad)
    if (level === 'campaign') {
      whereConditions.campaignId = { [Op.not]: null };
      whereConditions.adsetId = null;
      whereConditions.adId = null;
    } else if (level === 'adset') {
      whereConditions.adsetId = { [Op.not]: null };
      whereConditions.adId = null;
    } else if (level === 'ad') {
      whereConditions.adId = { [Op.not]: null };
    }

    // Buscar dados
    const data = await AdData.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastSyncedAt', 'DESC']],
      attributes: { exclude: ['rawData'] } // Excluir o campo rawData para reduzir o tamanho da resposta
    });

    return res.json({
      success: true,
      count: data.count,
      data: data.rows,
      pagination: {
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados de anúncios por conexão:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dados de anúncios por conexão',
      error: error.message 
    });
  }
};

/**
 * Obter estatísticas de desempenho consolidadas
 */
exports.getPerformanceStats = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, groupBy = 'day', adAccountId } = req.query;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Construir condições de consulta
    const whereConditions = {
      companyId: companyId,
      adsetId: { [Op.not]: null }, // Nível de granularidade adset para desempenho
      adId: null // Excluir dados específicos de anúncios
    };

    // Adicionar filtro de conta de anúncios, se fornecido
    if (adAccountId) {
      whereConditions.adAccountId = adAccountId;
    }

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Definir o agrupamento temporal
    const timeGrouping = getTimeGroupingSQL(groupBy);

    // Consulta para estatísticas agregadas
    const stats = await AdData.findAll({
      where: whereConditions,
      attributes: [
        [Sequelize.literal(timeGrouping), 'period'],
        [Sequelize.fn('SUM', Sequelize.col('impressions')), 'impressions'],
        [Sequelize.fn('SUM', Sequelize.col('clicks')), 'clicks'],
        [Sequelize.fn('SUM', Sequelize.col('spend')), 'spend'],
        [Sequelize.fn('AVG', Sequelize.col('ctr')), 'ctr'],
        [Sequelize.fn('AVG', Sequelize.col('cpc')), 'cpc'],
        [Sequelize.fn('AVG', Sequelize.col('cpm')), 'cpm'],
        [Sequelize.fn('SUM', Sequelize.col('conversions')), 'conversions'],
        [Sequelize.fn('AVG', Sequelize.col('cost_per_conversion')), 'costPerConversion']
      ],
      group: ['period'],
      order: [[Sequelize.literal('period'), 'ASC']]
    });

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de desempenho:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter estatísticas de desempenho',
      error: error.message 
    });
  }
};

/**
 * Obter dados de campanhas
 */
exports.getCampaignData = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Construir condições de consulta
    const whereConditions = {
      companyId: companyId,
      campaignId: { [Op.not]: null },
      adsetId: null,
      adId: null
    };

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Buscar dados
    const data = await AdData.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['spend', 'DESC']], // Ordenar por gasto para mostrar as campanhas mais relevantes primeiro
      attributes: { exclude: ['rawData'] }
    });

    return res.json({
      success: true,
      count: data.count,
      data: data.rows,
      pagination: {
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados de campanhas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dados de campanhas',
      error: error.message 
    });
  }
};

/**
 * Obter dados de conjuntos de anúncios
 */
exports.getAdSetData = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, campaignId, limit = 100, offset = 0 } = req.query;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Construir condições de consulta
    const whereConditions = {
      companyId: companyId,
      adsetId: { [Op.not]: null },
      adId: null
    };

    // Adicionar filtro de campanha, se fornecido
    if (campaignId) {
      whereConditions.campaignId = campaignId;
    }

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Buscar dados
    const data = await AdData.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['spend', 'DESC']], // Ordenar por gasto para mostrar os conjuntos mais relevantes primeiro
      attributes: { exclude: ['rawData'] }
    });

    return res.json({
      success: true,
      count: data.count,
      data: data.rows,
      pagination: {
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados de conjuntos de anúncios:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dados de conjuntos de anúncios',
      error: error.message 
    });
  }
};

/**
 * Obter dados de anúncios individuais
 */
exports.getAdData = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, adsetId, campaignId, limit = 100, offset = 0 } = req.query;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Construir condições de consulta
    const whereConditions = {
      companyId: companyId,
      adId: { [Op.not]: null }
    };

    // Adicionar filtro de conjunto de anúncios, se fornecido
    if (adsetId) {
      whereConditions.adsetId = adsetId;
    }

    // Adicionar filtro de campanha, se fornecido
    if (campaignId) {
      whereConditions.campaignId = campaignId;
    }

    // Adicionar filtro de data, se fornecido
    if (startDate && endDate) {
      whereConditions.dateStart = { [Op.gte]: new Date(startDate) };
      whereConditions.dateEnd = { [Op.lte]: new Date(endDate) };
    }

    // Buscar dados
    const data = await AdData.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['spend', 'DESC']], // Ordenar por gasto para mostrar os anúncios mais relevantes primeiro
      attributes: { exclude: ['rawData'] }
    });

    return res.json({
      success: true,
      count: data.count,
      data: data.rows,
      pagination: {
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados de anúncios:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dados de anúncios',
      error: error.message 
    });
  }
};

/**
 * Iniciar sincronização manual para uma conexão específica
 */
exports.syncConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Buscar a conexão para verificar acesso
    const connection = await ApiConnection.findByPk(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Conexão não encontrada' });
    }

    // Verificar acesso à empresa da conexão
    if (!await hasCompanyAccess(req.user.id, connection.companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta conexão' });
    }

    // Verificar se a plataforma é Meta
    if (connection.platform !== 'meta') {
      return res.status(400).json({ 
        success: false,
        message: 'Esta função só está disponível para conexões com o Meta' 
      });
    }

    // Iniciar sincronização em background
    res.json({ 
      success: true, 
      message: 'Sincronização iniciada em segundo plano',
      connectionId: connection.id,
      companyId: connection.companyId
    });

    // Processo de sincronização após a resposta
    try {
      const result = await metaService.syncConnectionData(connectionId);
      console.log(`Sincronização concluída para conexão ${connectionId}:`, result);
    } catch (syncError) {
      console.error(`Erro ao sincronizar conexão ${connectionId}:`, syncError);
    }
  } catch (error) {
    console.error('Erro ao iniciar sincronização de conexão:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar sincronização',
      error: error.message 
    });
  }
};

/**
 * Iniciar sincronização manual para todas as conexões de uma empresa
 */
exports.syncCompanyConnections = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verificar acesso à empresa
    if (!await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    // Buscar todas as conexões Meta da empresa
    const connections = await ApiConnection.findAll({
      where: {
        companyId: companyId,
        platform: 'meta',
        isActive: true
      }
    });

    if (connections.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Nenhuma conexão ativa do Meta encontrada para esta empresa' 
      });
    }

    // Iniciar sincronização em background
    res.json({ 
      success: true, 
      message: 'Sincronização iniciada em segundo plano',
      companyId: companyId,
      connectionCount: connections.length
    });

    // Processo de sincronização após a resposta usando o serviço dedicado
    try {
      const result = await metaService.syncCompanyConnections(companyId);
      console.log(`Sincronização concluída para empresa ${companyId}:`, result);
    } catch (syncError) {
      console.error(`Erro ao sincronizar conexões da empresa ${companyId}:`, syncError);
    }
  } catch (error) {
    console.error('Erro ao iniciar sincronização de empresa:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar sincronização',
      error: error.message 
    });
  }
};

/**
 * Altera o modo de sincronização para tempo real ou intervalo personalizado
 */
exports.changeSyncMode = async (req, res) => {
  try {
    const { mode } = req.body;
    
    // Verificar se o usuário é administrador
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem alterar o modo de sincronização'
      });
    }
    
    // Alterar modo de sincronização
    const success = metaDataSync.changeSyncMode(mode);
    
    if (success) {
      return res.json({
        success: true,
        message: `Modo de sincronização alterado para ${mode === 'realtime' ? 'TEMPO REAL' : `${mode} minutos`}`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Falha ao alterar modo de sincronização'
      });
    }
  } catch (error) {
    console.error('Erro ao alterar modo de sincronização:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao alterar modo de sincronização',
      error: error.message
    });
  }
};

/**
 * Iniciar sincronização imediata (em tempo real)
 */
exports.syncNow = async (req, res) => {
  try {
    const { connectionId, companyId } = req.body;
    
    // Verificar permissões
    if (companyId && !await hasCompanyAccess(req.user.id, companyId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado a esta empresa' 
      });
    }
    
    if (connectionId) {
      // Verificar se o usuário tem acesso à conexão
      const connection = await ApiConnection.findByPk(connectionId);
      if (!connection) {
        return res.status(404).json({ 
          success: false, 
          message: 'Conexão não encontrada' 
        });
      }
      
      if (!await hasCompanyAccess(req.user.id, connection.companyId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado a esta conexão' 
        });
      }
    }
    
    // Iniciar a sincronização
    const syncResponse = await metaDataSync.runManualSync(connectionId, companyId);
    
    return res.json({
      success: true,
      message: 'Sincronização iniciada',
      data: syncResponse
    });
  } catch (error) {
    console.error('Erro ao iniciar sincronização em tempo real:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao iniciar sincronização em tempo real',
      error: error.message
    });
  }
};

/**
 * Obter status de sincronização atual
 */
exports.getSyncStatus = async (req, res) => {
  try {
    // Verificar permissões (apenas administradores podem ver o status)
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem ver o status de sincronização'
      });
    }
    
    // Determinar o modo atual com base nas variáveis de ambiente
    const currentMode = process.env.META_SYNC_INTERVAL === 'realtime' ? 
      'TEMPO REAL' : 
      `${process.env.META_SYNC_INTERVAL || '1'} minutos`;
    
    // Obter últimas sincronizações
    const lastSyncs = await AdData.findAll({
      attributes: [
        'connectionId',
        [Sequelize.fn('MAX', Sequelize.col('last_synced_at')), 'lastSync']
      ],
      group: ['connection_id'],
      limit: 10,
      order: [[Sequelize.fn('MAX', Sequelize.col('last_synced_at')), 'DESC']]
    });
    
    return res.json({
      success: true,
      data: {
        currentMode,
        lastSyncs
      }
    });
  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter status de sincronização',
      error: error.message
    });
  }
};

// Funções auxiliares

/**
 * Verificar se o usuário tem acesso à empresa
 */
async function hasCompanyAccess(userId, companyId) {
  try {
    // Verificar se existe relação entre usuário e empresa
    const { UserCompany } = require('../models');
    const userCompany = await UserCompany.findOne({
      where: {
        userId: userId,
        companyId: companyId
      }
    });
    
    return !!userCompany;
  } catch (error) {
    console.error('Erro ao verificar acesso à empresa:', error);
    return false;
  }
}

/**
 * Obter expressão SQL para agrupamento temporal
 */
function getTimeGroupingSQL(groupBy) {
  switch (groupBy) {
    case 'day':
      return "DATE_FORMAT(date_start, '%Y-%m-%d')";
    case 'week':
      return "DATE_FORMAT(date_start, '%Y-%u')";
    case 'month':
      return "DATE_FORMAT(date_start, '%Y-%m')";
    case 'quarter':
      return "CONCAT(YEAR(date_start), '-', QUARTER(date_start))";
    case 'year':
      return "YEAR(date_start)";
    default:
      return "DATE_FORMAT(date_start, '%Y-%m-%d')";
  }
}

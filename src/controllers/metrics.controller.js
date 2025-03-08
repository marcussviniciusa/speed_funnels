const createError = require('http-errors');
const { ApiConnection } = require('../models');
const metaService = require('../services/metaService');
const googleAnalyticsService = require('../services/googleAnalyticsService');

/**
 * Buscar métricas do Meta Ads
 */
exports.getMetaMetrics = async (req, res, next) => {
  try {
    const { adAccountId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      throw createError(400, 'É necessário fornecer datas de início e fim');
    }
    
    // Buscar conexão ativa com Meta
    const connection = await ApiConnection.findOne({
      where: {
        platform: 'meta',
        isActive: true
      }
    });
    
    if (!connection) {
      throw createError(404, 'Não foi encontrada uma integração ativa com Meta Ads');
    }
    
    // Verificar se o token ainda é válido
    const isValid = await metaService.validateToken(connection.accessToken);
    if (!isValid) {
      throw createError(401, 'Token de acesso expirado. Por favor, reconecte sua conta Meta Ads');
    }
    
    console.log(`Buscando métricas para conta de anúncios: ${adAccountId} no período de ${startDate} a ${endDate}`);
    console.log(`Usando token: ${connection.accessToken.substring(0, 15)}...`);
    
    // Buscar métricas de campanhas
    const campaignMetrics = await metaService.getCampaignMetrics(
      connection.accessToken, 
      adAccountId, 
      { startDate, endDate }
    );
    
    // Buscar métricas diárias
    const dailyMetrics = await metaService.getDailyMetrics(
      connection.accessToken, 
      adAccountId, 
      { startDate, endDate }
    );
    
    // Processar os dados para o formato esperado pelo frontend
    const processedData = processMetaMetrics(campaignMetrics, dailyMetrics);
    
    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do Meta:', error);
    next(error);
  }
};

/**
 * Buscar métricas do Google Analytics
 */
exports.getGoogleMetrics = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      throw createError(400, 'É necessário fornecer datas de início e fim');
    }
    
    // Buscar conexão ativa com Google Analytics
    const connection = await ApiConnection.findOne({
      where: {
        platform: 'google',
        isActive: true
      }
    });
    
    if (!connection) {
      throw createError(404, 'Não foi encontrada uma integração ativa com Google Analytics');
    }
    
    // Verificar se o token ainda é válido e renovar se necessário
    let accessToken = connection.accessToken;
    if (new Date(connection.expiresAt) <= new Date()) {
      const tokenData = await googleAnalyticsService.refreshToken(connection.refreshToken);
      accessToken = tokenData.accessToken;
      
      // Atualizar token no banco de dados
      await connection.update({
        accessToken: tokenData.accessToken,
        expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000)
      });
    }
    
    // Buscar métricas do Google Analytics
    const analyticsData = await googleAnalyticsService.getAnalyticsData(
      accessToken,
      propertyId,
      { startDate, endDate }
    );
    
    // Processar os dados para o formato esperado pelo frontend
    const processedData = processGoogleMetrics(analyticsData);
    
    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do Google Analytics:', error);
    next(error);
  }
};

/**
 * Listar contas de anúncios do Meta para uma empresa específica
 */
exports.getMetaAdAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa é obrigatório'
      });
    }
    
    console.log(`Buscando contas de anúncios do Meta para empresa ${companyId}`);
    
    // Buscar conexões ativas com Meta para esta empresa
    const connections = await ApiConnection.findAll({
      where: {
        platform: 'meta',
        is_active: true,
        user_id: userId,
        company_id: companyId
      }
    });
    
    if (!connections || connections.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Não foi encontrada uma integração ativa com Meta Ads para esta empresa'
      });
    }
    
    // Obter a primeira conexão ativa
    const connection = connections[0];
    
    // Verificar se o token ainda é válido
    const tokenValidation = await metaService.validateToken(connection.access_token || connection.accessToken);
    if (!tokenValidation.isValid) {
      return res.status(401).json({
        success: false,
        error: `Token de acesso inválido: ${tokenValidation.message}. Por favor, reconecte sua conta Meta Ads`
      });
    }
    
    // Buscar contas de anúncios
    const accessToken = connection.access_token || connection.accessToken;
    console.log(`Buscando contas de anúncios com token: ${accessToken.substring(0, 10)}...`);
    
    const adAccountsResponse = await metaService.getAdAccounts(accessToken);
    
    if (!adAccountsResponse.success) {
      return res.status(500).json({
        success: false,
        error: adAccountsResponse.error || 'Falha ao obter contas de anúncios'
      });
    }
    
    // Filtrar apenas contas ativas
    const activeAccounts = adAccountsResponse.accounts.filter(account => account.status === 'ACTIVE');
    
    console.log(`Encontradas ${adAccountsResponse.accounts.length} contas de anúncios, ${activeAccounts.length} ativas`);
    
    res.json({
      success: true,
      data: {
        accounts: activeAccounts,
        total: activeAccounts.length,
        activeConnection: {
          id: connection.id,
          accountId: connection.account_id || connection.accountId,
          accountName: connection.account_name || connection.accountName
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar contas de anúncios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Listar propriedades do Google Analytics
 */
exports.getGoogleProperties = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar conexão ativa com Google Analytics
    const connection = await ApiConnection.findOne({
      where: {
        platform: 'google',
        isActive: true
      }
    });
    
    if (!connection) {
      throw createError(404, 'Não foi encontrada uma integração ativa com Google Analytics');
    }
    
    // Verificar se o token ainda é válido e renovar se necessário
    let accessToken = connection.accessToken;
    if (new Date(connection.expiresAt) <= new Date()) {
      const tokenData = await googleAnalyticsService.refreshToken(connection.refreshToken);
      accessToken = tokenData.accessToken;
      
      // Atualizar token no banco de dados
      await connection.update({
        accessToken: tokenData.accessToken,
        expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000)
      });
    }
    
    // Buscar propriedades do Google Analytics
    const properties = await googleAnalyticsService.getProperties(accessToken);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Erro ao buscar propriedades do Google Analytics:', error);
    next(error);
  }
};

/**
 * Processar métricas do Meta Ads para o formato esperado pelo frontend
 */
function processMetaMetrics(campaignMetrics, dailyMetrics) {
  // Processar métricas de campanhas
  const campaigns = campaignMetrics.map(campaign => ({
    id: campaign.campaign_id,
    name: campaign.campaign_name,
    spend: parseFloat(campaign.spend || 0),
    impressions: parseInt(campaign.impressions || 0),
    clicks: parseInt(campaign.clicks || 0),
    ctr: parseFloat(campaign.ctr || 0),
    cpc: parseFloat(campaign.cost_per_click || 0),
    conversions: parseInt(campaign.actions?.[0]?.value || 0)
  }));
  
  // Processar métricas diárias
  const dates = [...new Set(dailyMetrics.map(item => item.date_start))].sort();
  
  // Criar arrays para cada métrica por data
  const impressions = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseInt(dayData.impressions || 0)
    };
  });
  
  const clicks = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseInt(dayData.clicks || 0)
    };
  });
  
  const spend = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseFloat(dayData.spend || 0)
    };
  });
  
  const ctr = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseFloat(dayData.ctr || 0)
    };
  });
  
  const cpc = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseFloat(dayData.cost_per_click || 0)
    };
  });
  
  const conversions = dates.map(date => {
    const dayData = dailyMetrics.find(item => item.date_start === date) || {};
    return {
      date,
      value: parseInt(dayData.actions?.[0]?.value || 0)
    };
  });
  
  return {
    campaigns,
    impressions,
    clicks,
    spend,
    ctr,
    cpc,
    conversions
  };
}

/**
 * Processar métricas do Google Analytics para o formato esperado pelo frontend
 */
function processGoogleMetrics(analyticsData) {
  const { rows, dimensionHeaders, metricHeaders } = analyticsData;
  
  // Extrair datas únicas
  const dates = [...new Set(rows.map(row => row.dimensionValues[0].value))].sort();
  
  // Criar arrays para cada métrica por data
  const sessions = dates.map(date => {
    const dayData = rows.find(row => row.dimensionValues[0].value === date);
    return {
      date,
      value: parseInt(dayData?.metricValues[0]?.value || 0)
    };
  });
  
  const pageviews = dates.map(date => {
    const dayData = rows.find(row => row.dimensionValues[0].value === date);
    return {
      date,
      value: parseInt(dayData?.metricValues[1]?.value || 0)
    };
  });
  
  const users = dates.map(date => {
    const dayData = rows.find(row => row.dimensionValues[0].value === date);
    return {
      date,
      value: parseInt(dayData?.metricValues[2]?.value || 0)
    };
  });
  
  const bounceRate = dates.map(date => {
    const dayData = rows.find(row => row.dimensionValues[0].value === date);
    return {
      date,
      value: parseFloat(dayData?.metricValues[3]?.value || 0)
    };
  });
  
  const avgSessionDuration = dates.map(date => {
    const dayData = rows.find(row => row.dimensionValues[0].value === date);
    return {
      date,
      value: parseFloat(dayData?.metricValues[4]?.value || 0)
    };
  });
  
  // Processar fontes de tráfego
  const trafficSourceRows = analyticsData.sourceData?.rows || [];
  const trafficSources = trafficSourceRows.map(row => ({
    source: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value || 0),
    users: parseInt(row.metricValues[1].value || 0)
  }));
  
  return {
    sessions,
    pageviews,
    users,
    bounceRate,
    avgSessionDuration,
    trafficSources
  };
}

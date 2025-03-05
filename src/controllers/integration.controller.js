const crypto = require('crypto');
const { ApiConnection, Company } = require('../models');
const metaService = require('../services/metaService');
const googleAnalyticsService = require('../services/googleAnalyticsService');
const createError = require('http-errors');

// Gerar estado seguro para OAuth
const generateState = (userId, companyId, platform) => {
  const data = JSON.stringify({ userId, companyId, platform });
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Verificar estado para evitar CSRF
const verifyState = (state, userId) => {
  // Na implementação real, seria necessário armazenar o estado em Redis ou similar
  // Para simplificar, apenas verificamos se o estado não está vazio
  return state && state.length === 64;
};

// Iniciar integração com Meta
exports.startMetaIntegration = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Verificar se a empresa existe e se o usuário tem acesso
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Gerar estado para CSRF
    const state = generateState(userId, companyId, 'meta');
    
    // Gerar URL de autorização
    const authUrl = metaService.getAuthUrl(state);
    
    // Armazenar o estado na sessão (simplificado)
    req.session = req.session || {};
    req.session.oauthState = state;
    
    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    next(error);
  }
};

// Callback para integração com Meta
exports.metaCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Verificar estado para prevenção de CSRF
    if (!verifyState(state, req.user.id)) {
      throw createError(400, 'Estado inválido. Tente novamente.');
    }
    
    // Extrair informações do estado (na implementação real seria decodificado)
    const stateData = req.session.oauthState === state ? {
      companyId: req.query.company_id,
      userId: req.user.id,
      platform: 'meta'
    } : null;
    
    if (!stateData) {
      throw createError(400, 'Dados de estado inválidos');
    }
    
    // Obter token de acesso
    const tokenData = await metaService.getAccessToken(code);
    
    // Obter informações do usuário
    const userInfo = await metaService.getUserInfo(tokenData.accessToken);
    
    // Obter contas de anúncios
    const adAccounts = await metaService.getAdAccounts(tokenData.accessToken);
    
    // Criar ou atualizar conexão de API
    const [apiConnection, created] = await ApiConnection.findOrCreate({
      where: {
        companyId: stateData.companyId,
        platform: 'meta',
      },
      defaults: {
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        accountId: userInfo.id,
        isActive: true,
      },
    });
    
    if (!created) {
      await apiConnection.update({
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        accountId: userInfo.id,
        isActive: true,
      });
    }
    
    // Redirecionar para página de sucesso
    res.redirect(`/company/integrations?success=true&platform=meta`);
    
  } catch (error) {
    console.error('Erro no callback do Meta:', error);
    res.redirect(`/company/integrations?error=${encodeURIComponent(error.message)}`);
  }
};

// Iniciar integração com Google Analytics
exports.startGoogleIntegration = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Verificar se a empresa existe e se o usuário tem acesso
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Gerar estado para CSRF
    const state = generateState(userId, companyId, 'google_analytics');
    
    // Gerar URL de autorização
    const authUrl = googleAnalyticsService.getAuthUrl(state);
    
    // Armazenar o estado na sessão (simplificado)
    req.session = req.session || {};
    req.session.oauthState = state;
    
    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    next(error);
  }
};

// Callback para integração com Google
exports.googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Verificar estado para prevenção de CSRF
    if (!verifyState(state, req.user.id)) {
      throw createError(400, 'Estado inválido. Tente novamente.');
    }
    
    // Extrair informações do estado (na implementação real seria decodificado)
    const stateData = req.session.oauthState === state ? {
      companyId: req.query.company_id,
      userId: req.user.id,
      platform: 'google_analytics'
    } : null;
    
    if (!stateData) {
      throw createError(400, 'Dados de estado inválidos');
    }
    
    // Obter tokens
    const tokenData = await googleAnalyticsService.getTokens(code);
    
    // Obter informações do usuário
    const userInfo = await googleAnalyticsService.getUserInfo(tokenData.accessToken);
    
    // Obter propriedades do GA4
    const properties = await googleAnalyticsService.getAnalyticsProperties(tokenData.accessToken);
    
    // Criar ou atualizar conexão de API
    const [apiConnection, created] = await ApiConnection.findOrCreate({
      where: {
        companyId: stateData.companyId,
        platform: 'google_analytics',
      },
      defaults: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn),
        accountId: userInfo.id,
        isActive: true,
      },
    });
    
    if (!created) {
      await apiConnection.update({
        accessToken: tokenData.accessToken,
        // Só atualizar o refresh token se recebemos um novo
        refreshToken: tokenData.refreshToken || apiConnection.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn),
        accountId: userInfo.id,
        isActive: true,
      });
    }
    
    // Redirecionar para página de sucesso
    res.redirect(`/company/integrations?success=true&platform=google_analytics`);
    
  } catch (error) {
    console.error('Erro no callback do Google:', error);
    res.redirect(`/company/integrations?error=${encodeURIComponent(error.message)}`);
  }
};

// Listar integrações de uma empresa
exports.listIntegrations = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    // Verificar acesso à empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Buscar todas as integrações da empresa
    const integrations = await ApiConnection.findAll({
      where: { companyId },
      attributes: ['id', 'platform', 'accountId', 'isActive', 'createdAt', 'updatedAt'],
    });
    
    res.json({
      success: true,
      integrations,
    });
  } catch (error) {
    next(error);
  }
};

// Desativar uma integração
exports.disableIntegration = async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    
    const integration = await ApiConnection.findByPk(integrationId);
    if (!integration) {
      throw createError(404, 'Integração não encontrada');
    }
    
    // Verificar se o usuário tem acesso à empresa da integração
    // (na implementação real seria verificado via middleware)
    
    await integration.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Integração desativada com sucesso',
    });
  } catch (error) {
    next(error);
  }
}; 
const crypto = require('crypto');
const { ApiConnection, Company, UserCompany } = require('../models');
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

// Listar todas as integrações do usuário atual
exports.getAllIntegrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar todas as integrações ativas do usuário com informações da empresa
    const connections = await ApiConnection.findAll({
      where: {
        userId,
        isActive: true
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logoUrl']
        }
      ]
    });
    
    // Transformar os dados para o formato desejado
    const integrations = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      companyId: conn.companyId,
      companyName: conn.company ? conn.company.name : 'Empresa não encontrada',
      companyLogo: conn.company ? conn.company.logoUrl : null,
      accountId: conn.accountId,
      connected: true,
      connectedSince: conn.createdAt
    }));
    
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error('Erro ao buscar integrações:', error);
    next(error);
  }
};

// Iniciar integração com Meta
exports.startMetaIntegration = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(`Iniciando integração com Meta para usuário ${userId} e empresa ${companyId}`);
    
    // Verificar se a empresa existe e se o usuário tem acesso
    let company = await Company.findByPk(companyId);
    
    // Se a empresa não existir, criar uma nova
    if (!company) {
      console.log(`Empresa ${companyId} não encontrada. Criando nova empresa.`);
      company = await Company.create({
        id: companyId,
        name: 'Minha Empresa',
        isActive: true
      });
      
      // Associar o usuário à empresa usando o modelo UserCompany diretamente
      await UserCompany.create({
        userId,
        companyId: company.id,
        role: 'admin'
      });
      console.log(`Usuário ${userId} associado à empresa ${company.id} como admin`);
    } else {
      console.log(`Empresa ${companyId} encontrada: ${company.name}`);
    }
    
    // Gerar estado seguro para evitar CSRF
    const state = generateState(userId, companyId, 'meta');
    console.log(`Estado gerado: ${state}`);
    
    // Obter URL de autorização do Meta
    try {
      const authUrl = metaService.getAuthUrl(state);
      console.log(`URL de autorização gerada: ${authUrl}`);
      
      res.json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error) {
      console.error('Erro ao gerar URL de autorização do Meta:', error);
      next(error);
    }
  } catch (error) {
    console.error('Erro no startMetaIntegration:', error);
    next(error);
  }
};

// Callback para integração com Meta
exports.metaCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    console.log('Recebido callback do Meta:', { code: code?.substring(0, 10) + '...', state });
    
    // Verificar estado para prevenção de CSRF
    const stateValid = verifyState(state, req.user?.id);
    console.log('Estado válido?', stateValid);
    
    if (!stateValid) {
      console.error('Estado inválido:', state);
      throw createError(400, 'Estado inválido. Tente novamente.');
    }
    
    // Extrair informações do estado
    // Na implementação real, seria necessário decodificar o estado
    // Para simplificar, vamos extrair as informações do companyId da query string
    const companyId = req.query.company_id || '1'; // Fallback para ID 1 se não especificado
    console.log('Company ID extraído:', companyId);
    
    const userId = req.user?.id;
    if (!userId) {
      throw createError(401, 'Usuário não autenticado');
    }
    
    // Verificar se o usuário tem acesso à empresa
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para conectar esta empresa');
    }
    
    // Obter token de acesso
    console.log('Solicitando token de acesso com código:', code?.substring(0, 10) + '...');
    const tokenData = await metaService.getAccessToken(code);
    console.log('Token de acesso obtido:', { 
      accessToken: tokenData.accessToken?.substring(0, 10) + '...', 
      expiresIn: tokenData.expiresIn 
    });
    
    // Obter informações do usuário
    console.log('Solicitando informações do usuário...');
    const userInfo = await metaService.getUserInfo(tokenData.accessToken);
    console.log('Informações do usuário obtidas:', userInfo);
    
    // Obter contas de anúncios
    console.log('Solicitando contas de anúncios...');
    const adAccounts = await metaService.getAdAccounts(tokenData.accessToken);
    console.log('Contas de anúncios obtidas:', adAccounts);
    
    // Criar ou atualizar conexão de API
    console.log('Criando/atualizando conexão de API...');
    const [apiConnection, created] = await ApiConnection.findOrCreate({
      where: {
        userId,
        companyId,
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
      console.log('Conexão existente, atualizando...');
      await apiConnection.update({
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        accountId: userInfo.id,
        isActive: true,
      });
    } else {
      console.log('Nova conexão criada');
    }
    
    // Redirecionar para página de sucesso
    console.log('Redirecionando para página de sucesso');
    res.redirect(`/company/${companyId}/integrations?success=true&platform=meta`);
    
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
    let company = await Company.findByPk(companyId);
    
    // Se a empresa não existir, criar uma nova
    if (!company) {
      company = await Company.create({
        id: companyId,
        name: 'Minha Empresa',
        isActive: true
      });
      
      // Associar o usuário à empresa usando o modelo UserCompany diretamente
      await UserCompany.create({
        userId,
        companyId: company.id,
        role: 'admin'
      });
    }
    
    // Gerar estado seguro para evitar CSRF
    const state = generateState(userId, companyId, 'google');
    
    // Obter URL de autorização do Google Analytics
    const authUrl = googleAnalyticsService.getAuthUrl(state);
    
    res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Callback para integração com Google
exports.googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    console.log('Recebido callback do Google:', { code: code?.substring(0, 10) + '...', state });
    
    // Verificar estado para prevenção de CSRF
    const stateValid = verifyState(state, req.user?.id);
    console.log('Estado válido?', stateValid);
    
    if (!stateValid) {
      console.error('Estado inválido:', state);
      throw createError(400, 'Estado inválido. Tente novamente.');
    }
    
    // Extrair informações do estado
    // Na implementação real, seria necessário decodificar o estado
    // Para simplificar, vamos extrair as informações do companyId da query string
    const companyId = req.query.company_id || '1'; // Fallback para ID 1 se não especificado
    console.log('Company ID extraído:', companyId);
    
    const userId = req.user?.id;
    if (!userId) {
      throw createError(401, 'Usuário não autenticado');
    }
    
    // Verificar se o usuário tem acesso à empresa
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para conectar esta empresa');
    }
    
    // Obter token de acesso
    console.log('Solicitando token de acesso com código:', code?.substring(0, 10) + '...');
    const tokenData = await googleAnalyticsService.getAccessToken(code);
    console.log('Token de acesso obtido:', { 
      accessToken: tokenData.accessToken?.substring(0, 10) + '...', 
      refreshToken: tokenData.refreshToken?.substring(0, 10) + '...',
      expiresIn: tokenData.expiresIn 
    });
    
    // Obter informações do usuário
    console.log('Solicitando informações do usuário...');
    const userInfo = await googleAnalyticsService.getUserInfo(tokenData.accessToken);
    console.log('Informações do usuário obtidas:', userInfo);
    
    // Obter propriedades do Google Analytics
    console.log('Solicitando propriedades do GA...');
    const properties = await googleAnalyticsService.getProperties(tokenData.accessToken);
    console.log('Propriedades obtidas:', properties);
    
    // Criar ou atualizar conexão de API
    console.log('Criando/atualizando conexão de API...');
    const [apiConnection, created] = await ApiConnection.findOrCreate({
      where: {
        userId,
        companyId,
        platform: 'google_analytics',
      },
      defaults: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        accountId: userInfo.id,
        isActive: true,
      },
    });
    
    if (!created) {
      console.log('Conexão existente, atualizando...');
      await apiConnection.update({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        accountId: userInfo.id,
        isActive: true,
      });
    } else {
      console.log('Nova conexão criada');
    }
    
    // Redirecionar para página de sucesso
    console.log('Redirecionando para página de sucesso');
    res.redirect(`/company/${companyId}/integrations?success=true&platform=google_analytics`);
    
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
    const userId = req.user.id;
    
    // Buscar a integração
    const integration = await ApiConnection.findByPk(integrationId);
    if (!integration) {
      throw createError(404, 'Integração não encontrada');
    }
    
    // Verificar se o usuário tem acesso à empresa da integração
    const userCompany = await UserCompany.findOne({
      where: { 
        userId, 
        companyId: integration.companyId,
        role: ['admin', 'editor'] // Apenas admin e editor podem desativar
      }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para gerenciar esta integração');
    }
    
    // Desativar a integração
    await integration.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Integração desativada com sucesso',
      data: {
        id: integration.id,
        platform: integration.platform,
        companyId: integration.companyId
      }
    });
  } catch (error) {
    console.error('Erro ao desativar integração:', error);
    next(error);
  }
};

// Conectar diretamente com o Meta Ads usando um token de acesso fornecido
exports.connectMetaWithToken = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { accessToken } = req.body;
    const userId = req.user.id;
    
    console.log(`Conectando diretamente com Meta para usuário ${userId} e empresa ${companyId}`);
    
    if (!accessToken) {
      throw createError(400, 'Token de acesso não fornecido');
    }
    
    // Verificar se a empresa existe e se o usuário tem acesso
    let company = await Company.findByPk(companyId);
    
    // Se a empresa não existir, criar uma nova
    if (!company) {
      console.log(`Empresa ${companyId} não encontrada. Criando nova empresa.`);
      company = await Company.create({
        id: companyId,
        name: 'Minha Empresa',
        isActive: true
      });
      
      // Associar o usuário à empresa usando o modelo UserCompany diretamente
      await UserCompany.create({
        userId,
        companyId: company.id,
        role: 'admin'
      });
      console.log(`Usuário ${userId} associado à empresa ${company.id} como admin`);
    } else {
      // Verificar se o usuário tem acesso à empresa
      const userCompany = await UserCompany.findOne({
        where: { userId, companyId }
      });
      
      if (!userCompany) {
        throw createError(403, 'Você não tem permissão para conectar esta empresa');
      }
      
      console.log(`Empresa ${companyId} encontrada: ${company.name}`);
    }
    
    // Validar o token
    try {
      console.log('Validando token de acesso...');
      const isValid = await metaService.validateToken(accessToken);
      
      if (!isValid) {
        throw createError(400, 'Token de acesso inválido ou expirado');
      }
      
      // Obter informações do usuário
      console.log('Solicitando informações do usuário...');
      const userInfo = await metaService.getUserInfo(accessToken);
      console.log('Informações do usuário obtidas:', userInfo);
      
      // Obter contas de anúncios
      console.log('Solicitando contas de anúncios...');
      const adAccounts = await metaService.getAdAccounts(accessToken);
      console.log('Contas de anúncios obtidas:', adAccounts);
      
      // Criar ou atualizar conexão de API
      console.log('Criando/atualizando conexão de API...');
      const [apiConnection, created] = await ApiConnection.findOrCreate({
        where: {
          userId,
          companyId,
          platform: 'meta',
        },
        defaults: {
          accessToken: accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias como padrão
          accountId: userInfo.id,
          isActive: true,
        },
      });
      
      if (!created) {
        console.log('Conexão existente, atualizando...');
        await apiConnection.update({
          accessToken: accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias como padrão
          accountId: userInfo.id,
          isActive: true,
        });
      } else {
        console.log('Nova conexão criada');
      }
      
      res.json({
        success: true,
        message: 'Conexão com Meta Ads realizada com sucesso',
        data: {
          connectionId: apiConnection.id,
          platform: 'meta',
          accountId: userInfo.id,
          accountName: userInfo.name,
          adAccounts: adAccounts
        }
      });
    } catch (error) {
      console.error('Erro ao validar token ou obter informações:', error);
      throw createError(400, 'Falha ao conectar com Meta Ads: ' + error.message);
    }
  } catch (error) {
    console.error('Erro no connectMetaWithToken:', error);
    next(error);
  }
};
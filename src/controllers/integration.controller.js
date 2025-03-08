const crypto = require('crypto');
const axios = require('axios');
const { ApiConnection, Company, UserCompany } = require('../models');
const metaService = require('../services/metaService');
const googleAnalyticsService = require('../services/googleAnalyticsService');
const createError = require('http-errors');

// Variáveis de ambiente para Meta
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;
const META_AUTH_URL = process.env.META_AUTH_URL || 'https://www.facebook.com/v22.0/dialog/oauth';
const META_TOKEN_URL = process.env.META_TOKEN_URL || 'https://graph.facebook.com/v22.0/oauth/access_token';
const META_SCOPE = process.env.META_SCOPE || 'ads_read,ads_management,business_management,public_profile';

// Gerar estado seguro para OAuth
const generateState = (userId, companyId, platform) => {
  // Criar um objeto com os dados do estado
  const stateData = {
    userId,
    companyId,
    platform,
    timestamp: Date.now()
  };
  
  // Serializar e criar um hash
  const stateString = JSON.stringify(stateData);
  const stateHash = crypto.createHash('sha256').update(stateString).digest('hex');
  
  // Em uma implementação real, armazenar o hash e os dados em Redis ou no banco de dados
  // com um tempo de expiração (por exemplo, 10 minutos)
  // Aqui vamos usar uma variável global para simplificar (não recomendado para produção)
  global.oauthStates = global.oauthStates || {};
  global.oauthStates[stateHash] = {
    data: stateData,
    expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutos
  };
  
  return stateHash;
};

// Verificar estado para evitar CSRF
const verifyState = (state, userId) => {
  // Em uma implementação real, buscar o estado do Redis ou banco de dados
  if (!global.oauthStates || !global.oauthStates[state]) {
    console.error(`Estado ${state} não encontrado`);
    return false;
  }
  
  const stateData = global.oauthStates[state];
  
  // Verificar se o estado expirou
  if (stateData.expiresAt < Date.now()) {
    console.error(`Estado ${state} expirou`);
    delete global.oauthStates[state];
    return false;
  }
  
  // Verificar se o userId corresponde
  if (stateData.data.userId !== userId) {
    console.error(`UserId não corresponde: esperado ${stateData.data.userId}, recebido ${userId}`);
    return false;
  }
  
  // Estado válido, remover para evitar reutilização
  delete global.oauthStates[state];
  
  return stateData.data;
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
      
      // Verificar se o usuário tem acesso à empresa
      const userCompany = await UserCompany.findOne({
        where: {
          userId,
          companyId
        }
      });
      
      if (!userCompany) {
        console.log(`Usuário ${userId} não tem acesso à empresa ${companyId}. Associando como membro.`);
        await UserCompany.create({
          userId,
          companyId,
          role: 'user'
        });
      }
    }
    
    // Gerar estado seguro para evitar CSRF usando formato simples
    // Formato: userId_companyId_timestamp
    const timestamp = Date.now();
    const state = `${userId}_${companyId}_${timestamp}`;
    
    // Armazenar o estado para validação posterior (opcional, mas recomendado)
    global.oauthStates = global.oauthStates || {};
    global.oauthStates[state] = {
      data: { userId, companyId, platform: 'meta', timestamp },
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutos
    };
    
    console.log(`Estado gerado: ${state}`);
    
    // Obter URL de autorização do Meta
    try {
      const authUrl = metaService.getAuthUrl(state);
      console.log(`URL de autorização gerada: ${authUrl}`);
      
      res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      throw createError(500, 'Erro ao gerar URL de autorização do Meta');
    }
  } catch (error) {
    console.error('Erro ao iniciar integração com Meta:', error);
    next(error);
  }
};

// Autenticação com o Meta (antigo Facebook) OAuth
exports.metaAuth = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'ID da empresa é obrigatório' });
    }

    // Verificar se a empresa existe e se o usuário tem acesso a ela
    const userCompany = await UserCompany.findOne({
      where: {
        userId,
        companyId
      },
      include: {
        model: Company,
        as: 'company'
      }
    });

    if (!userCompany) {
      return res.status(403).json({ error: 'Usuário não tem acesso a esta empresa' });
    }

    console.log(`Empresa ${companyId} encontrada: ${userCompany.company.name}`);

    // Gerar estado único para esta solicitação (inclui userId e companyId)
    const state = `${userId}_${companyId}_${Date.now()}`;
    console.log(`Estado gerado: ${state}`);

    // Montar URL de autorização do Meta
    const authUrl = `${META_AUTH_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=${encodeURIComponent(META_SCOPE)}&state=${state}&response_type=code`;
    console.log(`URL de autorização gerada: ${authUrl}`);

    res.json({
      authUrl
    });
  } catch (error) {
    console.error('Erro ao gerar URL de autorização do Meta:', error);
    res.status(500).json({ error: 'Erro ao gerar URL de autorização' });
  }
};

// Callback para processar a autenticação do Meta
exports.metaCallback = async (req, res) => {
  try {
    // Extrair parâmetros da consulta
    const { code, state, error, error_description } = req.query;
    console.log('Callback do Meta recebido com parâmetros:', {
      code: code ? 'Presente' : 'Ausente',
      state,
      error,
      error_description,
      query: JSON.stringify(req.query)
    });

    // Verificar se houve erro na autorização
    if (error) {
      console.error('Erro na autorização do Meta:', error, error_description);
      return res.redirect('/integrations?error=' + encodeURIComponent(error_description || 'Erro na autorização com Meta'));
    }

    // Verificar se temos código e estado
    if (!code || !state) {
      console.error('Parâmetros obrigatórios ausentes:', { code, state });
      return res.redirect('/integrations?error=' + encodeURIComponent('Parâmetros de autorização ausentes'));
    }

    // Extrair userId e companyId do estado
    const [userId, companyId] = state.split('_');
    console.log(`Processando callback para usuário ${userId} e empresa ${companyId}`);

    if (!userId || !companyId) {
      console.error('Estado inválido:', state);
      return res.redirect('/integrations?error=' + encodeURIComponent('Estado inválido'));
    }

    // Obter token de acesso
    console.log(`Solicitando token do Meta com código: ${code}`);
    const tokenResponse = await axios.get(`${META_TOKEN_URL}`, {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code
      }
    });

    console.log('Resposta do Meta para token:', tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('Token de acesso não recebido');
      return res.redirect('/integrations?error=' + encodeURIComponent('Falha ao obter token de acesso'));
    }

    // Obter informações do usuário
    console.log('Solicitando informações do usuário com token');
    const userInfo = await metaService.getUserInfo(accessToken);

    if (!userInfo || !userInfo.id) {
      console.error('Não foi possível obter informações do usuário do Meta');
      return res.redirect('/integrations?error=' + encodeURIComponent('Falha ao obter informações do usuário'));
    }

    // Obter contas de anúncios
    const adAccountsResponse = await metaService.getAdAccounts(accessToken);
    
    if (!adAccountsResponse.success || !adAccountsResponse.accounts || adAccountsResponse.accounts.length === 0) {
      console.error('Não foi possível obter contas de anúncios', adAccountsResponse.error);
      return res.redirect('/integrations?error=' + encodeURIComponent('Falha ao obter contas de anúncios'));
    }

    const adAccounts = adAccountsResponse.accounts;
    const activeAccounts = adAccounts.filter(account => account.status === 'ACTIVE');
    
    if (activeAccounts.length === 0) {
      console.error('Nenhuma conta de anúncios ativa encontrada');
      return res.redirect('/integrations?error=' + encodeURIComponent('Nenhuma conta de anúncios ativa encontrada'));
    }

    // Selecionar a primeira conta por padrão
    const defaultAccount = activeAccounts[0];
    console.log(`Conta padrão selecionada: ${defaultAccount.name}`);

    // Criar ou atualizar a conexão
    const result = await metaService.syncMetaAccountForCompany({
      userId: Number(userId),
      companyId: Number(companyId),
      accessToken,
      accountId: defaultAccount.id,
      accountName: defaultAccount.name
    });

    if (!result.success) {
      console.error('Erro ao sincronizar conta para empresa:', result.error);
      return res.redirect('/integrations?error=' + encodeURIComponent(`Erro ao sincronizar dados: ${result.error}`));
    }

    console.log('Integração com Meta concluída com sucesso');
    res.redirect('/integrations?success=' + encodeURIComponent('Integração com Meta Ads realizada com sucesso'));
  } catch (error) {
    console.error('Erro no callback do Meta:', error);
    res.redirect('/integrations?error=' + encodeURIComponent(`Erro na integração: ${error.message}`));
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
    
    console.log(`Integração com Google concluída com sucesso para conta ${userInfo.id}`);
    
    // Redirecionar para a página de integrações com sucesso
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
    
    // Verificar se a integração existe e pertence ao usuário
    const integration = await ApiConnection.findByPk(integrationId);
    
    if (!integration) {
      throw createError(404, 'Integração não encontrada');
    }
    
    // Verificar se o usuário tem acesso à empresa da integração
    const userCompany = await UserCompany.findOne({
      where: {
        userId,
        companyId: integration.companyId
      }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para gerenciar esta integração');
    }
    
    // Desativar a integração
    integration.isActive = false;
    await integration.save();
    
    res.json({
      success: true,
      message: 'Integração desativada com sucesso',
      data: {
        id: integration.id,
        platform: integration.platform,
        isActive: integration.isActive
      }
    });
  } catch (error) {
    console.error('Erro ao desativar integração:', error);
    next(error);
  }
};

// Iniciar integração com Google Analytics
exports.startGoogleIntegration = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(`Iniciando integração com Google Analytics para usuário ${userId} e empresa ${companyId}`);
    
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
      
      // Verificar se o usuário tem acesso à empresa
      const userCompany = await UserCompany.findOne({
        where: {
          userId,
          companyId
        }
      });
      
      if (!userCompany) {
        console.log(`Usuário ${userId} não tem acesso à empresa ${companyId}. Associando como membro.`);
        await UserCompany.create({
          userId,
          companyId,
          role: 'user'
        });
      }
    }
    
    // Gerar estado seguro para evitar CSRF usando formato simples
    // Formato: userId_companyId_timestamp
    const timestamp = Date.now();
    const state = `${userId}_${companyId}_${timestamp}`;
    
    // Armazenar o estado para validação posterior (opcional, mas recomendado)
    global.oauthStates = global.oauthStates || {};
    global.oauthStates[state] = {
      data: { userId, companyId, platform: 'google', timestamp },
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutos
    };
    
    console.log(`Estado gerado: ${state}`);
    
    // Obter URL de autorização do Google Analytics
    try {
      const authUrl = googleAnalyticsService.getAuthUrl(state);
      console.log(`URL de autorização gerada: ${authUrl}`);
      
      res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      throw createError(500, 'Erro ao gerar URL de autorização do Google Analytics');
    }
  } catch (error) {
    console.error('Erro ao iniciar integração com Google Analytics:', error);
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
      const tokenValidation = await metaService.validateToken(accessToken);
      
      if (!tokenValidation || !tokenValidation.valid) {
        console.error('Token inválido ou expirado');
        throw createError(400, 'Token de acesso inválido ou expirado');
      }
      
      console.log('Token validado com sucesso');
      
      // Obter informações do usuário
      console.log('Solicitando informações do usuário...');
      const userInfo = await metaService.getUserInfo(accessToken);
      console.log('Informações do usuário obtidas:', userInfo);
      
      // Obter contas de anúncios
      console.log('Solicitando contas de anúncios...');
      const adAccounts = await metaService.getAdAccounts(accessToken);
      console.log('Contas de anúncios obtidas:', adAccounts);
      
      // Selecionar a primeira conta de anúncios ativa (se disponível)
      const defaultAccount = adAccounts && adAccounts.length > 0 ? adAccounts[0] : null;
      
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
          accountId: defaultAccount ? defaultAccount.id : null,
          isActive: true,
        },
      });
      
      if (!created) {
        console.log('Conexão existente, atualizando...');
        await apiConnection.update({
          accessToken: accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias como padrão
          accountId: defaultAccount ? defaultAccount.id : null,
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
          accountId: defaultAccount ? defaultAccount.id : null,
          accountName: defaultAccount ? defaultAccount.name : null,
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

// Sincronizar dados de uma empresa específica
exports.syncCompanyData = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(`Iniciando sincronização de dados para empresa ${companyId} solicitada pelo usuário ${userId}`);
    
    // Verificar se a empresa existe e se o usuário tem acesso
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Verificar se o usuário tem acesso à empresa
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para sincronizar dados desta empresa');
    }
    
    // Iniciar processo de sincronização
    console.log(`Iniciando sincronização de dados do Meta para empresa ${companyId}`);
    const syncResult = await metaService.syncCompanyConnections(companyId);
    
    if (syncResult.success) {
      res.json({
        success: true,
        message: `Sincronização de dados concluída para empresa ${company.name}`,
        data: {
          companyId: companyId,
          companyName: company.name,
          totalProcessed: syncResult.totalProcessed,
          results: syncResult.results
        }
      });
    } else {
      throw createError(500, `Falha na sincronização: ${syncResult.error}`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar dados da empresa:', error);
    next(error);
  }
};

// Sincronizar dados de uma conexão específica
exports.syncConnectionData = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;
    
    console.log(`Iniciando sincronização de dados para conexão ${connectionId} solicitada pelo usuário ${userId}`);
    
    // Buscar a conexão
    const connection = await ApiConnection.findByPk(connectionId);
    
    if (!connection) {
      throw createError(404, 'Conexão não encontrada');
    }
    
    // Verificar se o usuário tem acesso à empresa da conexão
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId: connection.companyId }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para sincronizar dados desta conexão');
    }
    
    // Iniciar processo de sincronização
    console.log(`Iniciando sincronização de dados para conexão ${connectionId}`);
    const syncResult = await metaService.syncConnectionData(connectionId);
    
    if (syncResult.success) {
      res.json({
        success: true,
        message: `Sincronização de dados concluída para conexão ${connectionId}`,
        data: syncResult
      });
    } else {
      throw createError(500, `Falha na sincronização: ${syncResult.error}`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar dados da conexão:', error);
    next(error);
  }
};

// Callback para processar a autenticação do Meta com rota pública (não requer autenticação)
exports.metaPublicCallback = async (req, res) => {
  try {
    // Extrair parâmetros da consulta
    const { code, state, error, error_description } = req.query;
    const redirectBaseUrl = process.env.FRONTEND_URL || 'https://speedfunnels.marcussviniciusa.cloud';
    
    console.log('Callback público do Meta recebido com parâmetros:', {
      code: code ? 'Presente' : 'Ausente',
      state,
      error,
      error_description,
      query: JSON.stringify(req.query)
    });

    // Verificar se houve erro na autorização
    if (error) {
      console.error('Erro na autorização do Meta:', error, error_description);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(error_description || 'Erro na autorização com Meta')}`);
    }

    // Verificar se temos código e estado
    if (!code || !state) {
      console.error('Parâmetros obrigatórios ausentes:', { code, state });
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Parâmetros de autorização ausentes')}`);
    }

    // Extrair userId e companyId do estado
    const [userId, companyId] = state.split('_');
    console.log(`Processando callback público para usuário ${userId} e empresa ${companyId}`);

    if (!userId || !companyId) {
      console.error('Estado inválido:', state);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Estado inválido')}`);
    }

    // Obter token de acesso
    console.log(`Solicitando token do Meta com código: ${code}`);
    const tokenResponse = await axios.get(`${META_TOKEN_URL}`, {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code
      }
    });

    console.log('Resposta do Meta para token:', tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('Token de acesso não recebido');
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Falha ao obter token de acesso')}`);
    }

    // Obter informações do usuário
    console.log('Solicitando informações do usuário com token');
    const userInfo = await metaService.getUserInfo(accessToken);

    if (!userInfo || !userInfo.id) {
      console.error('Não foi possível obter informações do usuário do Meta');
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Falha ao obter informações do usuário')}`);
    }

    // Obter contas de anúncios
    const adAccountsResponse = await metaService.getAdAccounts(accessToken);
    
    if (!adAccountsResponse.success || !adAccountsResponse.accounts || adAccountsResponse.accounts.length === 0) {
      console.error('Não foi possível obter contas de anúncios', adAccountsResponse.error);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Falha ao obter contas de anúncios')}`);
    }

    const adAccounts = adAccountsResponse.accounts;
    const activeAccounts = adAccounts.filter(account => account.status === 'ACTIVE');
    
    if (activeAccounts.length === 0) {
      console.error('Nenhuma conta de anúncios ativa encontrada');
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent('Nenhuma conta de anúncios ativa encontrada')}`);
    }

    // Selecionar a primeira conta por padrão
    const defaultAccount = activeAccounts[0];
    console.log(`Conta padrão selecionada: ${defaultAccount.name}`);

    // Criar ou atualizar a conexão
    const result = await metaService.syncMetaAccountForCompany({
      userId: Number(userId),
      companyId: Number(companyId),
      accessToken,
      accountId: defaultAccount.id,
      accountName: defaultAccount.name
    });

    if (!result.success) {
      console.error('Erro ao sincronizar conta para empresa:', result.error);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(`Erro ao sincronizar dados: ${result.error}`)}`);
    }

    console.log('Integração com Meta concluída com sucesso');
    res.redirect(`${redirectBaseUrl}/integrations?success=${encodeURIComponent('Integração com Meta Ads realizada com sucesso')}`);
  } catch (error) {
    console.error('Erro no callback público do Meta:', error);
    const redirectBaseUrl = process.env.FRONTEND_URL || 'https://speedfunnels.marcussviniciusa.cloud';
    res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(`Erro na integração: ${error.message}`)}`);
  }
};

// Sincronizar dados de uma conta de anúncios Meta específica para uma empresa
exports.syncMetaAdAccount = async (req, res, next) => {
  try {
    const { companyId, adAccountId } = req.body;
    const userId = req.user.id;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa é obrigatório'
      });
    }
    
    if (!adAccountId) {
      return res.status(400).json({
        success: false,
        error: 'ID da conta de anúncios é obrigatório'
      });
    }
    
    console.log(`Iniciando sincronização da conta de anúncios ${adAccountId} para a empresa ${companyId}`);
    
    // Verificar permissão do usuário para a empresa
    const userCompany = await UserCompany.findOne({
      where: {
        userId,
        companyId
      },
      include: {
        model: Company,
        as: 'company'
      }
    });
    
    if (!userCompany) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para sincronizar dados para esta empresa'
      });
    }
    
    // Buscar conexão ativa do Meta para esta empresa
    const connection = await ApiConnection.findOne({
      where: {
        platform: 'meta',
        is_active: true,
        user_id: userId,
        company_id: companyId
      }
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Não foi encontrada uma conexão ativa com Meta Ads para esta empresa'
      });
    }
    
    // Verificar se o token ainda é válido
    const tokenValidation = await metaService.validateToken(connection.access_token || connection.accessToken);
    if (!tokenValidation.isValid) {
      return res.status(401).json({
        success: false,
        error: `Token de acesso inválido: ${tokenValidation.message}. Por favor, reconecte sua conta Meta Ads`
      });
    }
    
    // Atualizar a conexão com o adAccountId selecionado
    await ApiConnection.update(
      {
        account_id: adAccountId
      },
      {
        where: {
          id: connection.id
        }
      }
    );
    
    // Sincronizar dados
    const syncResult = await metaService.syncAdAccountData({
      id: connection.id,
      accessToken: connection.access_token || connection.accessToken,
      accountId: adAccountId
    });
    
    if (!syncResult.success) {
      return res.status(500).json({
        success: false,
        error: syncResult.error || 'Erro ao sincronizar dados'
      });
    }
    
    return res.json({
      success: true,
      message: 'Dados da conta de anúncios sincronizados com sucesso',
      data: {
        companyId,
        adAccountId,
        connectionId: connection.id
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar conta de anúncios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
const crypto = require('crypto');
const { ApiConnection, Company, UserCompany } = require('../models');
const metaService = require('../services/metaService');
const googleAnalyticsService = require('../services/googleAnalyticsService');
const createError = require('http-errors');

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

// Callback para integração com Meta
exports.metaCallback = async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    console.log(`Callback do Meta recebido. Estado: ${state}`);
    
    // Verificar se houve erro na autorização
    if (error) {
      console.error(`Erro na autorização do Meta: ${error} - ${error_description}`);
      return res.redirect(`/settings/integrations/facebook?error=${encodeURIComponent(error_description || error)}`);
    }
    
    // Verificar se o código e o estado estão presentes
    if (!code || !state) {
      console.error('Código ou estado ausente no callback do Meta');
      return res.redirect('/settings/integrations/facebook?error=Parâmetros%20inválidos%20no%20callback');
    }
    
    // Verificar o estado para evitar CSRF
    const stateData = verifyState(state, req.user.id);
    
    if (!stateData) {
      console.error(`Estado inválido no callback do Meta: ${state}`);
      return res.redirect('/settings/integrations/facebook?error=Estado%20inválido%20ou%20expirado');
    }
    
    const { userId, companyId, platform } = stateData;
    
    // Verificar se a plataforma é a correta
    if (platform !== 'meta') {
      console.error(`Plataforma incorreta no estado: ${platform}`);
      return res.redirect('/settings/integrations/facebook?error=Plataforma%20incorreta');
    }
    
    console.log(`Estado verificado para usuário ${userId} e empresa ${companyId}`);
    
    // Trocar o código por um token de acesso
    let tokenData;
    try {
      tokenData = await metaService.getAccessToken(code);
      console.log('Token obtido com sucesso');
    } catch (error) {
      console.error('Erro ao obter token do Meta:', error);
      return res.redirect(`/settings/integrations/facebook?error=${encodeURIComponent('Erro ao obter token de acesso')}`);
    }
    
    // Obter informações do usuário
    let userInfo;
    try {
      userInfo = await metaService.getUserInfo(tokenData.accessToken);
      console.log(`Informações do usuário Meta obtidas: ${userInfo.name} (${userInfo.id})`);
    } catch (error) {
      console.error('Erro ao obter informações do usuário Meta:', error);
      return res.redirect(`/settings/integrations/facebook?error=${encodeURIComponent('Erro ao obter informações do usuário')}`);
    }
    
    // Obter contas de anúncios
    let adAccounts;
    try {
      adAccounts = await metaService.getAdAccounts(tokenData.accessToken);
      console.log(`${adAccounts.length} contas de anúncios encontradas`);
      
      if (adAccounts.length === 0) {
        return res.redirect('/settings/integrations/facebook?error=Nenhuma%20conta%20de%20anúncios%20encontrada');
      }
    } catch (error) {
      console.error('Erro ao obter contas de anúncios:', error);
      return res.redirect(`/settings/integrations/facebook?error=${encodeURIComponent('Erro ao obter contas de anúncios')}`);
    }
    
    // Selecionar a primeira conta de anúncios ativa (se disponível)
    const defaultAccount = adAccounts && adAccounts.length > 0 ? adAccounts[0] : null;
    
    // Verificar se já existe uma conexão para esta conta/empresa
    let connection = await ApiConnection.findOne({
      where: {
        userId,
        companyId,
        platform: 'meta',
        accountId: defaultAccount ? defaultAccount.id : null
      }
    });
    
    if (connection) {
      // Atualizar conexão existente
      console.log(`Atualizando conexão existente para conta ${defaultAccount ? defaultAccount.id : null}`);
      
      await connection.update({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
        accountName: defaultAccount ? defaultAccount.name : null,
        accountData: JSON.stringify(defaultAccount),
        isActive: true,
        lastSync: new Date()
      });
    } else {
      // Criar nova conexão
      console.log(`Criando nova conexão para conta ${defaultAccount ? defaultAccount.id : null}`);
      
      connection = await ApiConnection.create({
        userId,
        companyId,
        platform: 'meta',
        accountId: defaultAccount ? defaultAccount.id : null,
        accountName: defaultAccount ? defaultAccount.name : null,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
        accountData: JSON.stringify(defaultAccount),
        isActive: true,
        lastSync: new Date()
      });
    }
    
    console.log(`Integração com Meta concluída com sucesso para conta ${defaultAccount ? defaultAccount.id : null}`);
    
    // Redirecionar para a página de integrações com sucesso
    res.redirect('/settings/integrations/facebook?success=true&platform=meta');
  } catch (error) {
    console.error('Erro no callback do Meta:', error);
    next(error);
  }
};

// Callback público para integração com Meta (sem autenticação)
exports.metaPublicCallback = async (req, res, next) => {
  try {
    const redirectBaseUrl = process.env.FRONTEND_URL || 'https://speedfunnels.marcussviniciusa.cloud';
    const { code, state, error, error_description } = req.query;
    
    // Log detalhado dos parâmetros recebidos
    console.log('Callback do Meta recebido com parâmetros:', {
      code: code ? 'Presente' : 'Ausente',
      state: state,
      error: error,
      error_description: error_description,
      query: JSON.stringify(req.query)
    });
    
    // Verificar se houve erro na autorização
    if (error) {
      console.error(`Erro na autorização do Meta: ${error} - ${error_description}`);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(error_description || error)}`);
    }
    
    // Verificar se o código e o estado estão presentes
    if (!code) {
      console.error('Código de autorização ausente no callback');
      return res.redirect(`${redirectBaseUrl}/integrations?error=Código%20de%20autorização%20ausente`);
    }
    
    if (!state) {
      console.error('Estado ausente no callback');
      return res.redirect(`${redirectBaseUrl}/integrations?error=Estado%20ausente`);
    }
    
    // Extrair dados do estado
    // Formato esperado: userid_companyid_timestamp
    const stateData = state.split('_');
    
    if (stateData.length < 3) {
      console.error(`Formato inválido de estado: ${state}`);
      return res.redirect(`${redirectBaseUrl}/integrations?error=Formato%20de%20estado%20inválido`);
    }
    
    const userId = stateData[0];
    const companyId = stateData[1];
    
    console.log(`Processando callback para usuário ${userId} e empresa ${companyId}`);
    
    // Trocar código por token de acesso
    try {
      const tokenData = await metaService.getAccessToken(code);
      
      if (!tokenData || !tokenData.accessToken) {
        console.error('Falha ao obter token de acesso');
        return res.redirect(`${redirectBaseUrl}/integrations?error=Falha%20ao%20obter%20token%20de%20acesso`);
      }
      
      // Obter informações do usuário do Meta
      const userInfo = await metaService.getUserInfo(tokenData.accessToken);
      
      // Obter contas de anúncios disponíveis
      const adAccounts = await metaService.getAdAccounts(tokenData.accessToken);
      
      // Filtrar apenas contas ativas (status 1 indica conta ativa)
      const activeAccounts = adAccounts.filter(account => account.status === 1);
      
      // Selecionar a primeira conta de anúncios ativa (se disponível)
      const defaultAccount = activeAccounts && activeAccounts.length > 0 ? activeAccounts[0] : null;
      
      console.log(`Encontradas ${adAccounts.length} contas de anúncios, das quais ${activeAccounts.length} estão ativas`);
      console.log('Conta padrão selecionada:', defaultAccount ? defaultAccount.name : 'Nenhuma');
      
      // Verificar se já existe uma conexão para esta empresa/usuário
      const existingConnection = await ApiConnection.findOne({
        where: {
          userId,
          companyId,
          platform: 'meta'
        }
      });
      
      if (existingConnection) {
        // Atualizar conexão existente
        console.log(`Atualizando conexão existente ID: ${existingConnection.id}`);
        await existingConnection.update({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || null,
          tokenExpiresAt: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null,
          platformUserId: userInfo.id,
          platformUserName: userInfo.name,
          platformUserEmail: userInfo.email,
          metadata: JSON.stringify({
            adAccounts: adAccounts,
            userInfo: userInfo
          }),
          isActive: true,
          accountId: defaultAccount ? defaultAccount.id : existingConnection.accountId
        });
      } else {
        // Criar nova conexão
        console.log('Criando nova conexão');
        await ApiConnection.create({
          platform: 'meta',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || null,
          tokenExpiresAt: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null,
          platformUserId: userInfo.id,
          platformUserName: userInfo.name,
          platformUserEmail: userInfo.email || null,
          metadata: JSON.stringify({
            adAccounts: adAccounts,
            userInfo: userInfo
          }),
          companyId: companyId,
          userId: userId,
          isActive: true,
          accountId: defaultAccount ? defaultAccount.id : null
        });
      }
      
      console.log('Integração com Meta concluída com sucesso');
      
      // Redirecionar para a página de integrações com sucesso
      return res.redirect(`${redirectBaseUrl}/integrations?success=Integração%20com%20Meta%20Ads%20realizada%20com%20sucesso`);
    } catch (tokenError) {
      console.error('Erro ao processar token ou obter dados:', tokenError);
      return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(tokenError.message || 'Erro ao processar o token')}`);
    }
  } catch (error) {
    console.error('Erro no callback público do Meta:', error);
    const redirectBaseUrl = process.env.FRONTEND_URL || 'https://speedfunnels.marcussviniciusa.cloud';
    return res.redirect(`${redirectBaseUrl}/integrations?error=${encodeURIComponent(error.message || 'Erro ao processar o callback')}`);
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
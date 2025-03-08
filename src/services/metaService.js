const axios = require('axios');
const { ApiConnection } = require('../models');
const createError = require('http-errors');

const META_API_VERSION = 'v17.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Função auxiliar para esperar um intervalo de tempo
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Obter configuração de request delay do arquivo .env
const META_REQUEST_DELAY = parseInt(process.env.META_REQUEST_DELAY || 5000);
const META_MAX_RETRIES = parseInt(process.env.META_MAX_RETRIES || 5);
const META_INITIAL_BACKOFF = parseInt(process.env.META_INITIAL_BACKOFF || 10000);

// Sistema de gestão de taxa de requisições (Token Bucket)
const requestTokens = {
  // Rastreamento de tokens por conta de anúncio
  accounts: {},
  
  // Rastreamento de tokens globais
  global: {
    tokens: 50,            // Tokens disponíveis
    lastRefill: Date.now(), // Último reabastecimento
    maxTokens: 50,          // Máximo de tokens
    refillRate: 10000       // Taxa de reabastecimento em ms (10s)
  },
  
  // Inicializar bucket para uma conta específica
  initAccount(accountId) {
    if (!this.accounts[accountId]) {
      this.accounts[accountId] = {
        tokens: 10,          // Tokens disponíveis por conta
        lastRefill: Date.now(),
        maxTokens: 10,        // Máximo de tokens por conta
        refillRate: 60000     // Taxa de reabastecimento em ms (60s)
      };
    }
    return this.accounts[accountId];
  },
  
  // Reabastecer tokens
  refill(bucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const newTokens = Math.floor(timePassed / bucket.refillRate) * bucket.maxTokens;
    
    if (newTokens > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + newTokens);
      bucket.lastRefill = now;
    }
  },
  
  // Consumir um token (retorna true se disponível)
  consume(accountId = null) {
    // Sempre verifica o bucket global
    this.refill(this.global);
    
    if (this.global.tokens <= 0) {
      return false;
    }
    
    // Se temos uma conta específica, verificar também
    if (accountId) {
      const accountBucket = this.initAccount(accountId);
      this.refill(accountBucket);
      
      if (accountBucket.tokens <= 0) {
        return false;
      }
      
      // Consumir token da conta
      accountBucket.tokens--;
    }
    
    // Consumir token global
    this.global.tokens--;
    return true;
  }
};

// Implementação de retry com backoff exponencial avançado
const retryWithBackoff = async (fn, accountId = null, maxRetries = META_MAX_RETRIES, initialDelay = META_INITIAL_BACKOFF) => {
  let retries = 0;
  
  while (true) {
    try {
      // Verifica se há tokens disponíveis
      if (!requestTokens.consume(accountId)) {
        const waitTime = accountId ? 
          Math.max(requestTokens.global.refillRate, requestTokens.accounts[accountId].refillRate) : 
          requestTokens.global.refillRate;
          
        console.log(`Limite de requisições preventivo atingido. Aguardando ${waitTime/1000}s antes de tentar...`);
        await sleep(waitTime);
        continue;
      }
      
      // Espera do delay entre requisições
      await sleep(META_REQUEST_DELAY);
      
      return await fn();
    } catch (error) {
      // Verificar se é erro de limite de requisições
      const isRateLimitError = 
        error.response?.data?.error?.code === 17 || 
        error.response?.data?.error?.message?.includes('limit') ||
        error.response?.status === 429;
      
      if (retries >= maxRetries || !isRateLimitError) {
        throw error;
      }
      
      // Backoff exponencial com jitter para evitar sincronização de requisições
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      const delay = initialDelay * Math.pow(2, retries) * jitter;
      console.log(`Limite de requisições atingido. Aguardando ${Math.round(delay/1000)}s antes de tentar novamente... (Tentativa ${retries + 1}/${maxRetries})`);
      await sleep(delay);
      retries++;
    }
  }
};

// Função centralizada para fazer requisições para a API do Meta com controle de taxa
const makeMetaApiRequest = async (accountId, requestFn) => {
  return await retryWithBackoff(requestFn, accountId);
};

// Configurações do Meta OAuth
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://speedfunnels.marcussviniciusa.cloud/auth/callback/facebook';

// Verificar configurações
const verifyConfig = () => {
  if (!META_APP_ID) {
    console.error('META_APP_ID não está definido nas variáveis de ambiente');
    throw createError(500, 'Configuração do Meta incompleta: META_APP_ID não definido');
  }
  if (!META_APP_SECRET) {
    console.error('META_APP_SECRET não está definido nas variáveis de ambiente');
    throw createError(500, 'Configuração do Meta incompleta: META_APP_SECRET não definido');
  }
  return true;
};

// Gerar URL de autorização
exports.getAuthUrl = (state) => {
  verifyConfig();
  
  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
    'public_profile',
  ].join(',');

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${state}&response_type=code`;
};

// Trocar código por token de acesso
exports.getAccessToken = async (code) => {
  verifyConfig();
  
  return await retryWithBackoff(async () => {
    try {
      console.log('Solicitando token do Meta com código:', code);
      
      const response = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
        params: {
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code,
        },
      });

      console.log('Resposta do Meta para token:', JSON.stringify(response.data, null, 2));

      return {
        accessToken: response.data.access_token,
        // Meta não retorna refresh_token por padrão, usa long-lived tokens
        expiresIn: response.data.expires_in || 5184000, // 60 dias em segundos
      };
    } catch (error) {
      console.error('Erro ao obter token do Meta:', error.response?.data || error.message);
      throw createError(500, 'Erro ao autenticar com Meta: ' + (error.response?.data?.error?.message || error.message));
    }
  });
};

// Obter informações do usuário
exports.getUserInfo = async (accessToken) => {
  verifyConfig();
  
  console.log('Solicitando informações do usuário com token');
  
  try {
    // Usamos o ID global para este endpoint pois não está associado a uma conta específica
    const response = await makeMetaApiRequest(null, async () => {
      return await axios.get(`${META_BASE_URL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email',
        },
      });
    });
    
    console.log('Resposta do Meta para informações do usuário:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao obter informações do usuário Meta:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter dados do usuário Meta');
  }
};

// Obter contas de anúncios disponíveis
exports.getAdAccounts = async (accessToken) => {
  verifyConfig();
  
  console.log('Solicitando contas de anúncios');
  
  try {
    // Usamos o ID global para este endpoint pois estamos consultando /me/
    const response = await makeMetaApiRequest(null, async () => {
      return await axios.get(`${META_BASE_URL}/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_id,account_status,business_name,currency',
          limit: 25,
        },
      });
    });
    
    console.log('Resposta do Meta para contas de anúncios:', JSON.stringify(response.data, null, 2));
    
    // Normalizar os dados para facilitar o uso no frontend
    const accounts = response.data.data.map(account => ({
      id: account.id, // Mantém o formato completo (act_XXXXX)
      accountId: account.account_id, // ID numérico puro
      name: account.name,
      status: account.account_status,
      businessName: account.business_name || '',
      currency: account.currency
    }));
    
    return accounts;
  } catch (error) {
    console.error('Erro ao obter contas de anúncios:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter contas de anúncios Meta');
  }
};

// Buscar métricas de campanhas
exports.getCampaignMetrics = async (accessToken, adAccountId, dateRange) => {
  verifyConfig();
  
  // Remove o prefixo 'act_' se já estiver presente no ID da conta
  const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  // Extrair ID da conta para rastreamento de tokens
  const accountIdMatch = formattedAccountId.match(/act_(\d+)/);
  const accountId = accountIdMatch ? accountIdMatch[1] : formattedAccountId.replace('act_', '');
  
  console.log('Solicitando métricas de campanhas');
  console.log('Conta de anúncios formatada:', formattedAccountId);
  console.log('Período:', dateRange);
  
  try {
    const { startDate, endDate } = dateRange;
    
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${formattedAccountId}/insights`, {
        params: {
          access_token: accessToken,
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          level: 'campaign',
          fields: 'campaign_name,spend,impressions,clicks,reach,cpm,ctr,cost_per_result',
        },
      });
    });
    
    console.log(`Métricas recebidas para ${response.data.data?.length || 0} campanhas`);
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao obter métricas de campanhas:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter métricas de campanhas Meta');
  }
};

// Buscar métricas diárias
exports.getDailyMetrics = async (accessToken, adAccountId, dateRange) => {
  verifyConfig();
  
  // Remove o prefixo 'act_' se já estiver presente no ID da conta
  const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  // Extrair ID da conta para rastreamento de tokens
  const accountIdMatch = formattedAccountId.match(/act_(\d+)/);
  const accountId = accountIdMatch ? accountIdMatch[1] : formattedAccountId.replace('act_', '');
  
  console.log('Solicitando métricas diárias');
  console.log('Conta de anúncios formatada:', formattedAccountId);
  console.log('Período:', dateRange);
  
  try {
    const { startDate, endDate } = dateRange;
    
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${formattedAccountId}/insights`, {
        params: {
          access_token: accessToken,
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          time_increment: 1, // Dados diários
          level: 'account',
          fields: 'date_start,spend,impressions,clicks,ctr,cpc,actions',
        },
      });
    });
    
    console.log(`Métricas diárias recebidas: ${response.data.data?.length || 0} registros`);
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao obter métricas diárias:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter métricas diárias Meta');
  }
};

// Verificar se token ainda é válido
exports.validateToken = async (accessToken) => {
  verifyConfig();
  
  console.log('Verificando token de acesso');
  
  try {
    // Primeiro tentar usar o token para obter informações do usuário em vez de usar debug_token
    // Isso evita problemas de incompatibilidade de App ID
    try {
      const userInfoResponse = await makeMetaApiRequest(null, async () => {
        return await axios.get(`${META_BASE_URL}/me`, {
          params: {
            access_token: accessToken,
            fields: 'id,name',
          },
        });
      });
      
      // Se conseguir obter informações do usuário, o token é válido
      console.log('Token válido, conseguiu obter informações do usuário');
      return {
        valid: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Estimar validade de 60 dias
      };
    } catch (userInfoError) {
      // Se falhar, tentar usar o debug_token
      console.log('Falha ao validar token via userInfo, tentando debug_token');
      
      const response = await makeMetaApiRequest(null, async () => {
        return await axios.get(`${META_BASE_URL}/debug_token`, {
          params: {
            input_token: accessToken,
            access_token: `${META_APP_ID}|${META_APP_SECRET}`,
          },
        });
      });
      
      console.log('Resposta do Meta para validação de token:', JSON.stringify(response.data, null, 2));
      
      return {
        valid: response.data.data.is_valid,
        expiresAt: new Date(response.data.data.expires_at * 1000),
      };
    }
  } catch (error) {
    console.error('Erro ao validar token Meta:', error.response?.data || error.message);
    return { valid: false };
  }
};

// Renovar token de acesso
exports.refreshAccessToken = async (refreshToken) => {
  verifyConfig();
  
  try {
    console.log('Renovando token de acesso');
    
    // Meta não suporta refresh tokens da mesma forma que outros serviços
    // Esse é apenas um esboço para consistência da API
    console.log('Refresh tokens não são suportados pelo Meta no momento');
    
    return {
      success: false,
      message: 'Refresh tokens não são suportados pelo Meta, use o fluxo de autorização completo'
    };
  } catch (error) {
    console.error('Erro ao renovar token Meta:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Função para obter campanhas de uma conta de anúncios
exports.getCampaigns = async (accessToken, adAccountId) => {
  verifyConfig();
  
  console.log(`Buscando campanhas para a conta ${adAccountId}`);
  
  // Extrair ID da conta para rastreamento de tokens
  const accountIdMatch = adAccountId.match(/act_(\d+)/);
  const accountId = accountIdMatch ? accountIdMatch[1] : adAccountId.replace('act_', '');
  
  try {
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${adAccountId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,spend_cap,lifetime_budget,daily_budget,start_time,stop_time,created_time,updated_time',
          limit: 50  // Reduzido para evitar atingir limites de dados
        }
      });
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error.response?.data || error.message);
    throw error;
  }
};

// Função para obter conjuntos de anúncios (adsets) de uma campanha
exports.getAdSets = async (accessToken, campaignId) => {
  verifyConfig();
  
  console.log(`Buscando conjuntos de anúncios para a campanha ${campaignId}`);
  
  // Extrair ID da conta do campaignId (formato: act_XXXXX/campaigns/YYYYY)
  const accountIdMatch = campaignId.match(/act_(\d+)\//);
  const accountId = accountIdMatch ? accountIdMatch[1] : null;
  
  try {
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${campaignId}/adsets`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,bid_amount,bid_strategy',
          limit: 50  // Reduzido para evitar atingir limites de dados
        }
      });
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar conjuntos de anúncios:', error.response?.data || error.message);
    throw error;
  }
};

// Função para obter anúncios de um conjunto de anúncios
exports.getAds = async (accessToken, adsetId) => {
  verifyConfig();
  
  console.log(`Buscando anúncios para o conjunto ${adsetId}`);
  
  // Extrair ID da conta do adsetId (formato: act_XXXXX/adsets/YYYYY)
  const accountIdMatch = adsetId.match(/act_(\d+)\//);
  const accountId = accountIdMatch ? accountIdMatch[1] : null;
  
  try {
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${adsetId}/ads`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,adset_id,creative',
          limit: 50  // Reduzido para evitar atingir limites de dados
        }
      });
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error.response?.data || error.message);
    throw error;
  }
};

// Função para obter métricas de desempenho de anúncios
exports.getAdInsights = async (accessToken, adObjectId, datePreset = 'last_30d', level = 'ad') => {
  verifyConfig();
  
  console.log(`Buscando insights para ${level} ${adObjectId} no período ${datePreset}`);
  
  // Extrair ID da conta do adObjectId
  const accountIdMatch = adObjectId.match(/act_(\d+)\//);
  const accountId = accountIdMatch ? accountIdMatch[1] : null;
  
  try {
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${adObjectId}/insights`, {
        params: {
          access_token: accessToken,
          fields: 'impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values',
          level: level,
          date_preset: datePreset,
          limit: 50  // Reduzido para evitar atingir limites de dados
        }
      });
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar insights de anúncios:', error.response?.data || error.message);
    // Retorna array vazio em caso de erro em vez de propagar o erro
    return [];
  }
};

// Função para sincronizar todos os dados de anúncios de uma conta
exports.syncAdAccountData = async (connection) => {
  const { AdData } = require('../models');
  const { Sequelize } = require('sequelize');
  
  try {
    console.log(`Iniciando sincronização de dados para conexão ${connection.id} (Conta: ${connection.accountId})`);
    
    // Validar o token antes de prosseguir
    const tokenValidation = await exports.validateToken(connection.accessToken);
    if (!tokenValidation || !tokenValidation.valid) {
      console.error(`Token inválido para conexão ${connection.id}`);
      return { success: false, error: 'Token inválido ou expirado' };
    }
    
    // Obter campanhas
    const campaigns = await exports.getCampaigns(connection.accessToken, connection.accountId);
    console.log(`Encontradas ${campaigns.length} campanhas`);
    
    // Data de início e fim para os insights
    const dateEnd = new Date();
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 30); // Últimos 30 dias
    
    // Para cada campanha, obter insights e salvar
    for (const campaign of campaigns) {
      const campaignInsights = await exports.getAdInsights(connection.accessToken, campaign.id, 'last_30d', 'campaign');
      
      if (campaignInsights.length > 0) {
        const insight = campaignInsights[0];
        
        // Criar ou atualizar registro de dados da campanha
        await AdData.findOrCreate({
          where: {
            connectionId: connection.id,
            companyId: connection.companyId,
            adAccountId: connection.accountId,
            campaignId: campaign.id,
            dateStart: dateStart,
            dateEnd: dateEnd
          },
          defaults: {
            campaignName: campaign.name,
            status: campaign.status,
            impressions: insight.impressions || 0,
            clicks: insight.clicks || 0,
            spend: insight.spend || 0,
            reach: insight.reach || 0,
            frequency: insight.frequency || 0,
            cpc: insight.cpc || 0,
            cpm: insight.cpm || 0,
            ctr: insight.ctr || 0,
            conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
            costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
            lastSyncedAt: new Date(),
            rawData: JSON.stringify(insight)
          },
          hooks: false
        }).then(([record, created]) => {
          if (!created) {
            // Atualizar registro existente
            return record.update({
              campaignName: campaign.name,
              status: campaign.status,
              impressions: insight.impressions || 0,
              clicks: insight.clicks || 0,
              spend: insight.spend || 0,
              reach: insight.reach || 0,
              frequency: insight.frequency || 0,
              cpc: insight.cpc || 0,
              cpm: insight.cpm || 0,
              ctr: insight.ctr || 0,
              conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
              costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
              lastSyncedAt: new Date(),
              rawData: JSON.stringify(insight)
            });
          }
        });
      }
      
      // Obter conjuntos de anúncios (adsets) para cada campanha
      const adsets = await exports.getAdSets(connection.accessToken, campaign.id);
      console.log(`Encontrados ${adsets.length} conjuntos de anúncios para campanha ${campaign.name}`);
      
      // Para cada adset, obter insights e salvar
      for (const adset of adsets) {
        const adsetInsights = await exports.getAdInsights(connection.accessToken, adset.id, 'last_30d', 'adset');
        
        if (adsetInsights.length > 0) {
          const insight = adsetInsights[0];
          
          // Criar ou atualizar registro de dados do adset
          await AdData.findOrCreate({
            where: {
              connectionId: connection.id,
              companyId: connection.companyId,
              adAccountId: connection.accountId,
              campaignId: campaign.id,
              adsetId: adset.id,
              dateStart: dateStart,
              dateEnd: dateEnd
            },
            defaults: {
              campaignName: campaign.name,
              adsetName: adset.name,
              status: adset.status,
              impressions: insight.impressions || 0,
              clicks: insight.clicks || 0,
              spend: insight.spend || 0,
              reach: insight.reach || 0,
              frequency: insight.frequency || 0,
              cpc: insight.cpc || 0,
              cpm: insight.cpm || 0,
              ctr: insight.ctr || 0,
              conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
              costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
              lastSyncedAt: new Date(),
              rawData: JSON.stringify(insight)
            },
            hooks: false
          }).then(([record, created]) => {
            if (!created) {
              // Atualizar registro existente
              return record.update({
                campaignName: campaign.name,
                adsetName: adset.name,
                status: adset.status,
                impressions: insight.impressions || 0,
                clicks: insight.clicks || 0,
                spend: insight.spend || 0,
                reach: insight.reach || 0,
                frequency: insight.frequency || 0,
                cpc: insight.cpc || 0,
                cpm: insight.cpm || 0,
                ctr: insight.ctr || 0,
                conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                lastSyncedAt: new Date(),
                rawData: JSON.stringify(insight)
              });
            }
          });
        }
        
        // Obter anúncios para cada adset
        const ads = await exports.getAds(connection.accessToken, adset.id);
        console.log(`Encontrados ${ads.length} anúncios para o conjunto ${adset.name}`);
        
        // Para cada anúncio, obter insights e salvar
        for (const ad of ads) {
          const adInsights = await exports.getAdInsights(connection.accessToken, ad.id, 'last_30d', 'ad');
          
          if (adInsights.length > 0) {
            const insight = adInsights[0];
            
            // Criar ou atualizar registro de dados do anúncio
            await AdData.findOrCreate({
              where: {
                connectionId: connection.id,
                companyId: connection.companyId,
                adAccountId: connection.accountId,
                campaignId: campaign.id,
                adsetId: adset.id,
                adId: ad.id,
                dateStart: dateStart,
                dateEnd: dateEnd
              },
              defaults: {
                campaignName: campaign.name,
                adsetName: adset.name,
                adName: ad.name,
                status: ad.status,
                impressions: insight.impressions || 0,
                clicks: insight.clicks || 0,
                spend: insight.spend || 0,
                reach: insight.reach || 0,
                frequency: insight.frequency || 0,
                cpc: insight.cpc || 0,
                cpm: insight.cpm || 0,
                ctr: insight.ctr || 0,
                conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                lastSyncedAt: new Date(),
                rawData: JSON.stringify(insight)
              },
              hooks: false
            }).then(([record, created]) => {
              if (!created) {
                // Atualizar registro existente
                return record.update({
                  campaignName: campaign.name,
                  adsetName: adset.name,
                  adName: ad.name,
                  status: ad.status,
                  impressions: insight.impressions || 0,
                  clicks: insight.clicks || 0,
                  spend: insight.spend || 0,
                  reach: insight.reach || 0,
                  frequency: insight.frequency || 0,
                  cpc: insight.cpc || 0,
                  cpm: insight.cpm || 0,
                  ctr: insight.ctr || 0,
                  conversions: insight.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                  costPerConversion: insight.cost_per_action_type?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
                  lastSyncedAt: new Date(),
                  rawData: JSON.stringify(insight)
                });
              }
            });
          }
        }
      }
    }
    
    console.log(`Sincronização concluída para conexão ${connection.id}`);
    return { success: true };
  } catch (error) {
    console.error(`Erro ao sincronizar dados para conexão ${connection.id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Sincroniza dados de uma conexão específica pelo ID
 * @param {number} connectionId - ID da conexão a ser sincronizada
 * @returns {Promise<Object>} Resultado da sincronização
 */
exports.syncConnectionData = async (connectionId) => {
  try {
    const { ApiConnection } = require('../models');
    
    // Buscar a conexão específica
    const connection = await ApiConnection.findOne({
      where: {
        id: connectionId,
        platform: 'meta',
        isActive: true
      }
    });
    
    if (!connection) {
      return {
        success: false,
        error: `Conexão ID ${connectionId} não encontrada ou inativa`
      };
    }
    
    console.log(`Iniciando sincronização para conexão ID: ${connectionId}`);
    
    const result = await exports.syncAdAccountData(connection);
    
    return {
      connectionId: connection.id,
      accountId: connection.accountId,
      companyId: connection.companyId,
      success: result.success,
      error: result.error,
      totalProcessed: 1
    };
  } catch (error) {
    console.error(`Erro ao sincronizar conexão ID ${connectionId}:`, error);
    return {
      connectionId,
      success: false,
      error: error.message,
      totalProcessed: 0
    };
  }
};

/**
 * Sincroniza todas as conexões ativas de uma empresa específica
 * @param {number} companyId - ID da empresa
 * @returns {Promise<Object>} Resultados da sincronização
 */
exports.syncCompanyConnections = async (companyId) => {
  const { ApiConnection } = require('../models');
  
  // Função auxiliar para esperar um intervalo de tempo
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    // Buscar todas as conexões Meta ativas da empresa específica
    const connections = await ApiConnection.findAll({
      where: {
        companyId: companyId,
        platform: 'meta',
        isActive: true
      }
    });
    
    if (connections.length === 0) {
      return {
        success: false,
        error: `Nenhuma conexão ativa do Meta encontrada para a empresa ID ${companyId}`,
        totalProcessed: 0,
        results: []
      };
    }
    
    console.log(`Iniciando sincronização para ${connections.length} conexões da empresa ID: ${companyId}`);
    
    // Sincronizar cada conexão com intervalo entre requisições para evitar limites
    const results = [];
    const requestDelay = process.env.META_REQUEST_DELAY || 5000;
    
    for (const connection of connections) {
      try {
        // Atrasar antes de cada sincronização para evitar limites
        await sleep(requestDelay);
        
        // Sincronizar dados da conexão
        const result = await exports.syncAdAccountData(connection);
        
        results.push({
          connectionId: connection.id,
          accountId: connection.accountId,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        console.error(`Erro ao sincronizar conexão ${connection.id} da empresa ${companyId}:`, error);
        results.push({
          connectionId: connection.id,
          accountId: connection.accountId,
          success: false,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    
    return {
      companyId,
      success: true,
      totalProcessed: connections.length,
      results: results
    };
  } catch (error) {
    console.error(`Erro ao sincronizar conexões da empresa ${companyId}:`, error);
    return {
      companyId,
      success: false,
      error: error.message,
      totalProcessed: 0,
      results: []
    };
  }
};

// Função para sincronizar dados de todas as conexões ativas
exports.syncAllActiveConnections = async () => {
  const { ApiConnection } = require('../models');
  const { Sequelize } = require('sequelize');
  
  // Função auxiliar para esperar um intervalo de tempo
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Implementação de retry com backoff exponencial
  const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 2000) => {
    let retries = 0;
    
    while (true) {
      try {
        return await fn();
      } catch (error) {
        // Verificar se é erro de limite de requisições
        const isRateLimitError = 
          error.response?.data?.error?.code === 17 || 
          error.response?.data?.error?.message?.includes('limit');
        
        if (retries >= maxRetries || !isRateLimitError) {
          throw error;
        }
        
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Limite de requisições atingido. Aguardando ${delay/1000}s antes de tentar novamente...`);
        await sleep(delay);
        retries++;
      }
    }
  };
  
  try {
    // Buscar todas as conexões Meta ativas
    const connections = await ApiConnection.findAll({
      where: {
        platform: 'meta',
        isActive: true,
        accountId: {
          [Sequelize.Op.not]: null
        }
      }
    });
    
    console.log(`Iniciando sincronização para ${connections.length} conexões ativas`);
    
    // Sincronizar cada conexão com intervalo entre requisições para evitar limites
    const results = [];
    const requestDelay = process.env.META_REQUEST_DELAY || 1000; // 1 segundo entre requisições por padrão
    
    for (const connection of connections) {
      try {
        // Atrasar antes de cada sincronização para evitar limites
        await sleep(requestDelay);
        
        // Utilizar retry com backoff para lidar com limites de API
        const result = await retryWithBackoff(() => exports.syncAdAccountData(connection));
        
        results.push({
          connectionId: connection.id,
          accountId: connection.accountId,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        console.error(`Erro ao sincronizar conexão ${connection.id} após tentativas de retry:`, error);
        results.push({
          connectionId: connection.id,
          accountId: connection.accountId,
          success: false,
          error: error.message || 'Erro desconhecido após tentativas de retry'
        });
      }
    }
    
    return {
      totalProcessed: connections.length,
      results: results
    };
  } catch (error) {
    console.error('Erro ao sincronizar conexões ativas:', error);
    return {
      totalProcessed: 0,
      error: error.message,
      results: []
    };
  }
};
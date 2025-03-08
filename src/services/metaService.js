const axios = require('axios');
const { ApiConnection } = require('../models');
const createError = require('http-errors');

const META_API_VERSION = 'v22.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Função auxiliar para esperar um intervalo de tempo
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Obter configuração de request delay do arquivo .env
const META_REQUEST_DELAY = parseInt(process.env.META_REQUEST_DELAY || 1000);
const META_MAX_RETRIES = parseInt(process.env.META_MAX_RETRIES || 5);
const META_INITIAL_BACKOFF = parseInt(process.env.META_INITIAL_BACKOFF || 30000);

// Controle de limites e informações sobre a API do Meta
const META_RATE_LIMITS = {
  // Limites gerais da API do Meta para aplicações em modo de desenvolvimento
  // https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
  GLOBAL_RATE: {
    // Limites por aplicação e token
    APP_LEVEL: 200,     // Requisições por hora por aplicação
    USER_LEVEL: 200,    // Requisições por hora por usuário
  },
  // Limites específicos para contas de anúncios (geralmente mais baixos)
  ACCOUNT_RATE: 25,     // Requisições por minuto por conta de anúncios
  ACCOUNT_DAILY: 4000,  // Requisições diárias por conta de anúncios
};

// Sistema de gestão de taxa de requisições (Token Bucket) aprimorado
const requestTokens = {
  // Rastreamento de tokens por conta de anúncio
  accounts: {},
  
  // Rastreamento de tokens globais
  global: {
    tokens: 20,             // Tokens disponíveis
    lastRefill: Date.now(), // Último reabastecimento
    maxTokens: 20,          // Máximo de tokens
    refillRate: 90000,      // Taxa de reabastecimento em ms (90s = 20 tokens por 90s = 800/hora)
    waitingQueue: [],       // Fila de espera para requisições pendentes
  },
  
  // Inicializar bucket para uma conta específica
  initAccount(accountId) {
    if (!this.accounts[accountId]) {
      this.accounts[accountId] = {
        tokens: 3,           // Tokens disponíveis por conta
        lastRefill: Date.now(),
        maxTokens: 3,        // Máximo de tokens por conta
        refillRate: 120000,  // Taxa de reabastecimento em ms (120s = 3 tokens por 2 minutos = 90/hora)
        waitingQueue: [],    // Fila de espera
        dailyRequests: 0,    // Contador diário
        dailyResetTime: Date.now() + 86400000, // Próximo reset diário (24h)
      };
    }
    
    // Verificar se mudou o dia e resetar o contador diário
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    if (this.accounts[accountId].dailyResetTime < todayStart) {
      this.accounts[accountId].dailyRequests = 0;
      this.accounts[accountId].dailyResetTime = todayStart + 86400000; // +24h
    }
    
    return this.accounts[accountId];
  },
  
  // Reabastecer tokens
  refill(bucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const refillAmount = (timePassed / bucket.refillRate);
    
    if (refillAmount >= 0.1) { // Só atualiza se passou pelo menos 10% do tempo de reabastecimento
      const newTokens = Math.floor(refillAmount * bucket.maxTokens);
      
      if (newTokens > 0) {
        bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + newTokens);
        bucket.lastRefill = now - (timePassed % bucket.refillRate); // Preserva o resto do tempo
        
        // Processar fila de espera se houver tokens disponíveis
        this.processWaitingQueue(bucket);
      }
    }
  },
  
  // Processar fila de espera
  processWaitingQueue(bucket) {
    while (bucket.tokens > 0 && bucket.waitingQueue.length > 0) {
      const resolve = bucket.waitingQueue.shift();
      bucket.tokens--;
      resolve();
    }
  },
  
  // Consumir um token (retorna Promise)
  async consume(accountId = null) {
    return new Promise(async (resolve) => {
      // Sempre verifica o bucket global
      this.refill(this.global);
      
      // Se temos uma conta específica, verificar também
      let accountBucket = null;
      if (accountId) {
        accountBucket = this.initAccount(accountId);
        this.refill(accountBucket);
        
        // Verificar se atingimos o limite diário
        if (accountBucket.dailyRequests >= META_RATE_LIMITS.ACCOUNT_DAILY) {
          console.log(`Limite diário atingido para conta ${accountId}: ${accountBucket.dailyRequests}/${META_RATE_LIMITS.ACCOUNT_DAILY}`);
          
          // Espera até o próximo dia
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          const waitTime = tomorrow - now;
          console.log(`Aguardando até amanhã (${waitTime/1000}s) para resetar limite diário da conta ${accountId}`);
          
          await sleep(Math.min(waitTime, 3600000)); // Espera no máximo 1 hora e tenta novamente
          resolve(false);
          return;
        }
      }
      
      // Se não há tokens disponíveis globalmente ou para a conta específica
      if (this.global.tokens <= 0 || (accountId && accountBucket.tokens <= 0)) {
        const priorityQueue = accountId ? accountBucket.waitingQueue : this.global.waitingQueue;
        
        // Adicionar à fila de espera
        priorityQueue.push(resolve);
        
        // Log do estado atual
        console.log(`Aguardando token${accountId ? ` para conta ${accountId}` : ' global'}: ${
          accountId ? 
          `${accountBucket.tokens}/${accountBucket.maxTokens} (conta), ${this.global.tokens}/${this.global.maxTokens} (global)` : 
          `${this.global.tokens}/${this.global.maxTokens}`
        }`);
        
        // Calcular tempo estimado de espera
        const waitingTime = priorityQueue.length * (accountId ? 
          Math.max(accountBucket.refillRate, this.global.refillRate) / accountBucket.maxTokens : 
          this.global.refillRate / this.global.maxTokens);
          
        console.log(`Fila de espera: ${priorityQueue.length} requisições, tempo estimado: ${Math.ceil(waitingTime/1000)}s`);
        return;
      }
      
      // Consumir tokens
      this.global.tokens--;
      
      if (accountId) {
        accountBucket.tokens--;
        accountBucket.dailyRequests++;
        console.log(`Requisição #${accountBucket.dailyRequests} para conta ${accountId}`);
      }
      
      resolve(true);
    });
  }
};

// Implementação de retry com backoff exponencial avançado
const retryWithBackoff = async (fn, accountId = null, maxRetries = META_MAX_RETRIES, initialDelay = META_INITIAL_BACKOFF) => {
  let retries = 0;
  
  while (true) {
    try {
      // Verifica se há tokens disponíveis - isso já inclui a espera em fila se necessário
      const hasToken = await requestTokens.consume(accountId);
      if (!hasToken) {
        console.log(`Não foi possível obter token para requisição. Tentando novamente...`);
        await sleep(5000); // Pequena pausa antes de tentar novamente
        continue;
      }
      
      // Espera do delay entre requisições
      await sleep(META_REQUEST_DELAY);
      
      // Executa a função
      const result = await fn();
      return result;
    } catch (error) {
      // Verificar se é erro de limite de requisições
      const isRateLimitError = 
        error.response?.data?.error?.code === 17 || 
        error.response?.data?.error?.error_subcode === 2446079 ||
        error.response?.data?.error?.message?.includes('limit') ||
        error.response?.data?.error?.message?.includes('User request limit reached') ||
        error.response?.status === 429;
      
      // Log detalhado do erro
      if (isRateLimitError) {
        console.log(`Erro de limite de requisição detectado:`);
        console.log(`- Código: ${error.response?.data?.error?.code}`);
        console.log(`- Subcódigo: ${error.response?.data?.error?.error_subcode}`);
        console.log(`- Mensagem: ${error.response?.data?.error?.message}`);
        
        // Verificar cabeçalhos específicos de uso da API
        const appUsage = error.response?.headers?.['x-app-usage'];
        const adAccountUsage = error.response?.headers?.['x-ad-account-usage'];
        
        if (appUsage) {
          try {
            const usage = JSON.parse(appUsage);
            console.log(`- Uso da API: ${JSON.stringify(usage)}`);
          } catch (e) {
            console.log(`- Uso da API (formato inválido): ${appUsage}`);
          }
        }
        
        if (adAccountUsage) {
          try {
            const usage = JSON.parse(adAccountUsage);
            console.log(`- Uso da conta: ${JSON.stringify(usage)}`);
          } catch (e) {
            console.log(`- Uso da conta (formato inválido): ${adAccountUsage}`);
          }
        }
      } else {
        console.error(`Erro não relacionado a limite de requisições: ${error.message}`);
      }
      
      // Se excedeu tentativas ou não é erro de rate limit, propaga o erro
      if (retries >= maxRetries || !isRateLimitError) {
        throw error;
      }
      
      // Backoff exponencial com jitter para evitar sincronização de requisições
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      const delay = initialDelay * Math.pow(4, retries) * jitter; // Backoff mais agressivo (base 4)
      
      console.log(`Limite de requisições atingido. Aguardando ${Math.round(delay/1000)}s antes de tentar novamente... (Tentativa ${retries + 1}/${maxRetries})`);
      await sleep(delay);
      retries++;
    }
  }
};

// Função centralizada para fazer requisições para a API do Meta com controle de taxa
const makeMetaApiRequest = async (accountId, requestFn) => {
  // Obter ou inicializar bucket de conta específica
  const accountBucket = accountId ? requestTokens.initAccount(accountId) : null;
  
  // Verificar limite diário para a conta
  if (accountId && accountBucket) {
    // Reset do contador diário se necessário
    if (Date.now() > accountBucket.dailyResetTime) {
      accountBucket.dailyRequests = 0;
      accountBucket.dailyResetTime = Date.now() + 86400000; // +24h
    }
    
    // Verificar se atingiu o limite diário
    if (accountBucket.dailyRequests >= META_RATE_LIMITS.ACCOUNT_DAILY) {
      throw new Error(`Limite diário de requisições atingido para a conta ${accountId}`);
    }
  }
  
  // Consumir token global
  await requestTokens.consume(null);
  
  // Se tiver ID de conta, consumir token da conta também
  if (accountId) {
    await requestTokens.consume(accountId);
  }
  
  try {
    // Adicionar um pequeno atraso entre requisições para evitar rajadas
    await sleep(META_REQUEST_DELAY * (1 + Math.random() * 0.5));
    
    const response = await requestFn();
    
    // Incrementar contador de requisições diárias
    if (accountId && accountBucket) {
      accountBucket.dailyRequests++;
    }
    
    return response;
    
  } catch (error) {
    // Ajustar os tokens com base no erro
    if (error.response?.data?.error?.code === 17 || error.response?.status === 429) {
      // Se for erro de limite de taxa, reduzir tokens disponíveis para impedir novas requisições por um tempo
      if (accountId && requestTokens.accounts[accountId]) {
        requestTokens.accounts[accountId].tokens = 0;
      }
      requestTokens.global.tokens = Math.min(requestTokens.global.tokens, 3);
    }
    
    throw error;
  }
};

// Configurações do Meta OAuth
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://speedfunnels.marcussviniciusa.cloud/auth/callback/facebook';

// Configuração do Login do Facebook para Empresas
const META_BUSINESS_CONFIG_ID = process.env.META_BUSINESS_CONFIG_ID;

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

// Gerar URL de autorização usando Login do Facebook para Empresas
exports.getAuthUrl = (state) => {
  verifyConfig();
  
  // Verificar se temos um ID de configuração do Facebook para Empresas
  if (META_BUSINESS_CONFIG_ID) {
    console.log(`Usando Login do Facebook para Empresas com config_id: ${META_BUSINESS_CONFIG_ID}`);
    // Usar configuração do Login do Facebook para Empresas
    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&config_id=${META_BUSINESS_CONFIG_ID}&state=${state}&response_type=code&override_default_response_type=true`;
  } else {
    console.log('Config_id não configurado, usando fallback para scopes individuais');
    // Fallback para o método tradicional com scopes individuais
    const scopes = [
      'ads_read',
      'ads_management',
      'business_management',
      'public_profile',
    ].join(',');

    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${state}&response_type=code`;
  }
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

      // Verificar se estamos usando o Login do Facebook para Empresas
      // O token deve ser tratado de forma diferente, pois pode ser um token de sistema
      const tokenInfo = {
        accessToken: response.data.access_token,
        // Meta não retorna refresh_token por padrão, usa long-lived tokens
        expiresIn: response.data.expires_in || 5184000, // 60 dias em segundos
      };
      
      if (META_BUSINESS_CONFIG_ID) {
        console.log('Token obtido através do Login do Facebook para Empresas');
        if (response.data.data_access_expiration_time) {
          const expirationDate = new Date(response.data.data_access_expiration_time * 1000);
          console.log(`Acesso aos dados expira em: ${expirationDate.toISOString()}`);
          tokenInfo.dataAccessExpirationTime = response.data.data_access_expiration_time;
        }
        
        // Se tivermos o ID de usuário do sistema, podemos verificar se é um token de sistema
        if (response.data.business_id) {
          console.log(`Token associado ao portfólio empresarial ID: ${response.data.business_id}`);
          tokenInfo.businessId = response.data.business_id;
          tokenInfo.isSystemUserToken = true;
        }
      }
      
      return tokenInfo;
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
    // Gerar appsecret_proof para maior segurança
    const crypto = require('crypto');
    const appsecretProof = crypto
      .createHmac('sha256', META_APP_SECRET)
      .update(accessToken)
      .digest('hex');
    
    // Usamos o ID global para este endpoint pois não está associado a uma conta específica
    const response = await makeMetaApiRequest(null, async () => {
      return await axios.get(`${META_BASE_URL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,business_users{name,business}',
          appsecret_proof: appsecretProof
        },
      });
    });

    console.log('Token válido, conseguiu obter informações do usuário');
    
    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
    };
  } catch (error) {
    console.error('Erro ao obter informações do usuário Meta:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter informações do usuário Meta: ' + (error.response?.data?.error?.message || error.message));
  }
};

// Cache para armazenar respostas da API e reduzir chamadas repetidas
const responseCache = {
  data: {},
  
  // Define o tempo de vida do cache com base no tipo de dado
  TTL: {
    default: 3600000,  // 60 minutos
    campaigns: 7200000, // 2 horas
    adsets: 7200000,   // 2 horas
    ads: 7200000,      // 2 horas
    insights: 3600000, // 60 minutos
  },
  
  // Gera uma chave baseada nos parâmetros da requisição
  generateKey(endpoint, params) {
    const paramString = JSON.stringify(params);
    return `${endpoint}:${paramString}`;
  },
  
  // Verifica se há um valor válido no cache
  get(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const cachedItem = this.data[key];
    
    if (!cachedItem) return null;
    
    // Verificar se o cache expirou
    const now = Date.now();
    const cacheType = endpoint.includes('insights') ? 'insights' : 
                    endpoint.includes('campaigns') ? 'campaigns' :
                    endpoint.includes('adsets') ? 'adsets' :
                    endpoint.includes('ads') ? 'ads' : 'default';
    
    if (now - cachedItem.timestamp > this.TTL[cacheType]) {
      // Cache expirado, remover
      delete this.data[key];
      return null;
    }
    
    console.log(`Usando resposta em cache para ${endpoint}`);
    return cachedItem.data;
  },
  
  // Armazena um valor no cache
  set(endpoint, params, data) {
    const key = this.generateKey(endpoint, params);
    this.data[key] = {
      data,
      timestamp: Date.now()
    };
  },
  
  // Limpa entradas de cache específicas ou todo o cache
  clear(endpoint = null, params = null) {
    if (!endpoint) {
      // Limpar todo o cache
      this.data = {};
      return;
    }
    
    // Limpar entradas específicas
    if (params) {
      const key = this.generateKey(endpoint, params);
      delete this.data[key];
    } else {
      // Limpar todas as entradas que começam com o endpoint
      Object.keys(this.data).forEach(key => {
        if (key.startsWith(`${endpoint}:`)) {
          delete this.data[key];
        }
      });
    }
  }
};

// Função para obter conjuntos de anúncios (Ad Sets) de uma campanha
exports.getAdSets = async (accessToken, campaignId) => {
  try {
    // Verificar se temos dados em cache
    const cachedData = responseCache.get(`${campaignId}/adsets`, {
      access_token: accessToken,
      fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,bid_amount,bid_strategy',
      limit: 50
    });
    
    if (cachedData) {
      return cachedData;
    }
    
    // Extrair o ID da conta a partir do ID da campanha (geralmente act_XXXXX é o prefixo do ID da campanha)
    const accountIdMatch = campaignId.match(/act_(\d+)/);
    const accountId = accountIdMatch ? accountIdMatch[0] : null;
    
    const response = await makeMetaApiRequest(accountId, async () => {
      return await axios.get(`${META_BASE_URL}/${campaignId}/adsets`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,bid_amount,bid_strategy',
          limit: 50
        }
      });
    });
    
    // Armazenar resposta em cache
    responseCache.set(`${campaignId}/adsets`, {
      access_token: accessToken,
      fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,bid_amount,bid_strategy',
      limit: 50
    }, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar conjuntos de anúncios:', error.response?.data || error);
    throw error;
  }
};

// Função para obter dados de insights (métricas) de uma campanha
exports.getCampaignInsights = async (accessToken, campaignId, timeRange = 'last_30d') => {
  try {
    // Verificar se temos dados em cache
    const cachedData = responseCache.get(`${campaignId}/insights`, {
      access_token: accessToken,
      date_preset: 'last_30d' // Usando date_preset em vez de time_range
    });
    
    if (cachedData) {
      console.log(`Usando dados em cache para insights da campanha ${campaignId}`);
      return cachedData;
    }

    // Verificar formato do ID da campanha e remover prefixos potencialmente problemáticos
    let cleanCampaignId = campaignId;
    if (campaignId.includes('act_')) {
      console.warn(`ID de campanha com formato suspeito: ${campaignId}. Tentando limpar.`);
      const match = campaignId.match(/\d+/);
      if (match) {
        cleanCampaignId = match[0];
        console.log(`ID de campanha limpo: ${cleanCampaignId}`);
      } else {
        console.error(`Não foi possível extrair um ID válido de: ${campaignId}`);
        return { data: [] };
      }
    }

    const accountId = null; // Controle de taxa global
    console.log(`NOVA ESTRATÉGIA: Usando date_preset em vez de time_range para campanha ${cleanCampaignId}`);
    
    try {
      // Usando date_preset em vez de time_range para contornar o problema
      const params = {
        access_token: accessToken,
        date_preset: 'last_30d', // Isso é diferente do time_range e deve funcionar
        fields: 'impressions,clicks,spend,cpc,ctr,cpp,reach,frequency',
        level: 'campaign'
      };
      
      console.log(`Parâmetros da requisição usando date_preset: ${JSON.stringify({...params, access_token: '[REDACTED]'})}`);      
      
      const response = await makeMetaApiRequest(accountId, async () => {
        return await axios.get(`${META_BASE_URL}/${cleanCampaignId}/insights`, {
          params: params
        });
      });
      
      console.log(`Sucesso! Obtidos insights usando date_preset para campanha ${cleanCampaignId}`);
      
      // Armazenar resposta em cache
      responseCache.set(`${cleanCampaignId}/insights`, {
        access_token: accessToken,
        date_preset: 'last_30d'
      }, response.data);
      
      return response.data;
    } catch (datePresetError) {
      console.error(`Erro ao usar date_preset para campanha ${cleanCampaignId}:`, 
                  JSON.stringify(datePresetError.response?.data || datePresetError.message));
      
      console.log(`PLANO B: Tentando abordagem com busca direta de campos para campanha ${cleanCampaignId}`);
      
      try {
        // Abordagem alternativa: buscar a campanha diretamente com os campos relevantes
        const campaignResponse = await makeMetaApiRequest(accountId, async () => {
          return await axios.get(`${META_BASE_URL}/${cleanCampaignId}`, {
            params: {
              access_token: accessToken,
              fields: 'id,name,status,objective,daily_budget,lifetime_budget'
            }
          });
        });
        
        // Criar um objeto de resposta compatível com o formato esperado
        const formattedResponse = {
          data: [{
            campaign_id: cleanCampaignId,
            campaign_name: campaignResponse.data?.name || 'Desconhecido',
            impressions: '0',
            clicks: '0',
            spend: campaignResponse.data?.lifetime_budget || campaignResponse.data?.daily_budget || '0',
            objective: campaignResponse.data?.objective || 'Desconhecido',
            status: campaignResponse.data?.status || 'UNKNOWN'
          }]
        };
        
        console.log(`Criado objeto de resposta formatado com dados básicos da campanha ${cleanCampaignId}`);
        
        // Armazenar resposta em cache
        responseCache.set(`${cleanCampaignId}/insights`, {
          access_token: accessToken,
          date_preset: 'last_30d'
        }, formattedResponse);
        
        return formattedResponse;
      } catch (finalError) {
        console.error(`Todas as abordagens falharam para campanha ${cleanCampaignId}:`, 
                    JSON.stringify(finalError.response?.data || finalError.message));
        return { data: [] };
      }
    }
  } catch (error) {
    console.error(`Erro geral ao processar insights para campanha ${campaignId}:`, 
                JSON.stringify(error.response?.data || error.message));
    return { data: [] };
  }
};

// Função para obter campanhas de uma conta de anúncios
exports.getCampaigns = async (accessToken, adAccountId) => {
  try {
    // Verificar se temos dados em cache
    const cachedData = responseCache.get(`${adAccountId}/campaigns`, {
      access_token: accessToken,
      fields: 'id,name,status,objective,buying_type,daily_budget,lifetime_budget',
      limit: 50
    });
    
    if (cachedData) {
      return cachedData;
    }
    
    const response = await makeMetaApiRequest(adAccountId, async () => {
      return await axios.get(`${META_BASE_URL}/${adAccountId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,buying_type,daily_budget,lifetime_budget',
          limit: 50
        }
      });
    });
    
    // Armazenar resposta em cache
    responseCache.set(`${adAccountId}/campaigns`, {
      access_token: accessToken,
      fields: 'id,name,status,objective,buying_type,daily_budget,lifetime_budget',
      limit: 50
    }, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error.response?.data || error);
    throw error;
  }
};

// Função para obter contas de anúncios disponíveis para o usuário
exports.getAdAccounts = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('Token de acesso é obrigatório para buscar contas de anúncios');
    }
    
    console.log('Obtendo contas de anúncios do usuário');
    
    const accounts = await makeMetaApiRequest(null, async () => {
      return await axios.get(`${META_BASE_URL}/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status,amount_spent,balance,currency,funding_source,account_id,business,business_city,business_country_code,created_time',
          limit: 100
        }
      });
    });
    
    if (!accounts || !accounts.data || !accounts.data.data) {
      console.error('Falha ao buscar contas de anúncios');
      return { success: false, error: 'Falha ao buscar contas de anúncios' };
    }
    
    const adAccounts = accounts.data.data.map(account => ({
      id: account.id,
      name: account.name,
      accountId: account.id,
      status: account.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
      amountSpent: account.amount_spent,
      balance: account.balance,
      currency: account.currency,
      businessId: account.business ? account.business.id : null,
      businessName: account.business ? account.business.name : null,
      createdTime: account.created_time
    }));
    
    const activeAccounts = adAccounts.filter(account => account.status === 'ACTIVE');
    console.log(`Encontradas ${adAccounts.length} contas de anúncios, das quais ${activeAccounts.length} estão ativas`);
    
    return {
      success: true,
      accounts: adAccounts
    };
  } catch (error) {
    console.error('Erro ao buscar contas de anúncios:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para sincronizar dados de uma conta de anúncios
exports.syncAdAccountData = async (connection) => {
  try {
    // Verificar se temos um ID de conta válido
    if (!connection.accountId) {
      console.warn(`Pulando conexão ${connection.id} pois não possui ID de conta de anúncio válido`);
      return {
        success: false,
        error: 'ID de conta de anúncio não fornecido'
      };
    }

    console.log(`Iniciando sincronização de dados para conexão ${connection.id} (Conta: ${connection.accountId})`);
    
    // Verificar o token de acesso
    console.log(`Verificando token de acesso`);
    if (!connection.accessToken) {
      console.error(`Token de acesso não encontrado para conexão ${connection.id}`);
      // Atualizar o status da conexão para inativo
      if (connection.id) {
        await ApiConnection.update(
          { is_active: false },
          { where: { id: connection.id } }
        );
        console.log(`Conexão ${connection.id} marcada como inativa devido à falta de token`);
      }
      return {
        success: false,
        error: 'Token de acesso não encontrado'
      };
    }

    // Validar o token antes de fazer qualquer chamada
    console.log(`Verificando validade do token de acesso`);
    const tokenValidation = await exports.validateToken(connection.accessToken);
    if (!tokenValidation.isValid) {
      console.error(`Token inválido para conexão ${connection.id}: ${tokenValidation.message}`);
      // Atualizar o status da conexão para inativo
      if (connection.id) {
        await ApiConnection.update(
          { is_active: false },
          { where: { id: connection.id } }
        );
        console.log(`Conexão ${connection.id} marcada como inativa devido a token inválido`);
      }
      return {
        success: false,
        error: 'Token inválido ou expirado'
      };
    }
    
    // Verificar se podemos obter as informações do usuário com o token
    console.log(`Solicitando informações do usuário com token`);
    const userInfo = await exports.getUserInfo(connection.accessToken);
    if (!userInfo || !userInfo.id) {
      console.error(`Não foi possível obter informações do usuário para conexão ${connection.id}`);
      return {
        success: false,
        error: 'Não foi possível validar o usuário com o token fornecido'
      };
    }
    console.log(`Token válido, conseguiu obter informações do usuário`);
    
    // Buscar campanhas para a conta
    console.log(`Buscando campanhas para a conta ${connection.accountId}`);
    const campaigns = await exports.getCampaigns(connection.accessToken, connection.accountId);
    if (!campaigns || !campaigns.data) {
      console.error(`Falha ao buscar campanhas para conta ${connection.accountId}`);
      return {
        success: false,
        error: 'Falha ao buscar campanhas'
      };
    }
    console.log(`Encontradas ${campaigns.data.length} campanhas`);
    
    // Processar uma campanha por vez para controlar melhor a quantidade de requisições
    for (const campaign of campaigns.data) {
      // Se a campanha não estiver ativa, pular
      if (campaign.status !== 'ACTIVE') {
        continue;
      }
      
      try {
        // Obter insights
        console.log(`Buscando insights para campaign ${campaign.id} no período last_30d`);
        await exports.getCampaignInsights(connection.accessToken, campaign.id, 'last_30d');
        
        // Obter ad sets
        console.log(`Buscando conjuntos de anúncios para a campanha ${campaign.id}`);
        await exports.getAdSets(connection.accessToken, campaign.id);
      } catch (error) {
        // Apenas logar erro e continuar para a próxima campanha
        console.error(`Erro ao processar campanha ${campaign.id}:`, error.message);
      }
    }
    
    return { success: true, campaignsCount: campaigns.data.length };
  } catch (error) {
    console.error(`Erro ao sincronizar dados para conexão ${connection.id}:`, error);
    return { success: false, error: error.message, connectionId: connection.id, accountId: connection.accountId };
  }
};

// Função para sincronizar dados de todas as conexões ativas
exports.syncAllActiveConnections = async () => {
  try {
    // Obter todas as conexões ativas
    const connections = await ApiConnection.findAll({
      where: {
        platform: 'meta',  // Alterado de 'facebook' para 'meta' para consistência
        is_active: true
      }
    });
    
    console.log(`Iniciando sincronização para ${connections.length} conexões ativas`);
    
    // Para controlar melhor as chamadas de API, processamos uma conexão por vez
    const results = [];
    for (const connection of connections) {
      try {
        // Corrigir propriedades para usar camelCase consistentemente
        const normalizedConnection = {
          ...connection.dataValues, // Importante: obter dataValues para ter todas as propriedades do modelo
          id: connection.id,
          accessToken: connection.accessToken || connection.access_token,
          accountId: connection.accountId || connection.account_id,
          isActive: connection.isActive || connection.is_active,
          userId: connection.userId || connection.user_id,
          companyId: connection.companyId || connection.company_id
        };

        // Verificar se accountId está presente
        if (!normalizedConnection.accountId) {
          console.warn(`Pulando conexão ${normalizedConnection.id} pois não possui ID de conta de anúncio válido`);
          continue;
        }
        
        // Adicionar um atraso deliberado entre as conexões para evitar sobrecarga
        if (results.length > 0) {
          const delayMs = 15000; // Aumentado para 15 segundos
          await sleep(delayMs);
        }
        
        console.log(`Requisição #${results.length + 1} para conta ${normalizedConnection.accountId}`);
        
        const result = await retryWithBackoff(
          async () => await exports.syncAdAccountData(normalizedConnection),
          normalizedConnection.accountId,
          3, // Reduzido para 3 tentativas
          60000 // Backoff inicial mais alto (60s)
        );
        
        results.push(result);
      } catch (error) {
        console.error(`Erro ao processar conexão ${connection.id}:`, error);
        results.push({
          success: false,
          error: error.message,
          connectionId: connection.id
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erro ao sincronizar conexões ativas:', error);
    throw error;
  }
};

// Função para sincronizar uma conta do Meta para uma empresa específica
exports.syncMetaAccountForCompany = async ({ userId, companyId, accessToken, accountId, accountName }) => {
  try {
    if (!userId || !companyId || !accessToken || !accountId) {
      console.error('Parâmetros obrigatórios ausentes:', { userId, companyId, accessToken, accountId });
      return {
        success: false,
        error: 'Parâmetros obrigatórios ausentes'
      };
    }

    console.log(`Iniciando sincronização da conta ${accountId} para a empresa ${companyId}`);

    // Verificar se já existe uma conexão para este usuário, empresa e conta
    let connection = await ApiConnection.findOne({
      where: {
        user_id: userId,
        company_id: companyId,
        platform: 'meta',
        account_id: accountId
      }
    });

    // Se não existir, criar uma nova conexão
    if (!connection) {
      console.log(`Criando nova conexão Meta para usuário ${userId}, empresa ${companyId} e conta ${accountId}`);
      connection = await ApiConnection.create({
        user_id: userId,
        company_id: companyId,
        platform: 'meta',
        access_token: accessToken,
        account_id: accountId,
        account_name: accountName,
        is_active: true,
        last_sync: new Date()
      });
    } else {
      // Atualizar a conexão existente
      console.log(`Atualizando conexão existente ID: ${connection.id}`);
      await connection.update({
        access_token: accessToken,
        account_name: accountName || connection.account_name,
        is_active: true,
        last_sync: new Date()
      });
    }

    // Sincronizar os dados da conta
    const normalizedConnection = {
      ...connection.dataValues,
      id: connection.id,
      accessToken: accessToken,
      accountId: accountId,
      userId: userId,
      companyId: companyId
    };

    const syncResult = await exports.syncAdAccountData(normalizedConnection);
    
    return {
      success: syncResult.success,
      connectionId: connection.id,
      message: syncResult.success 
        ? `Conta ${accountId} sincronizada com sucesso` 
        : `Erro ao sincronizar conta: ${syncResult.error}`,
      error: syncResult.error
    };
  } catch (error) {
    console.error('Erro ao sincronizar conta para empresa:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Função para buscar anúncios de uma conta do Meta
exports.getAds = async (accessToken, adAccountId) => {
  try {
    if (!accessToken) {
      throw new Error('Token de acesso é obrigatório para buscar anúncios');
    }
    
    if (!adAccountId) {
      throw new Error('ID da conta de anúncios é obrigatório');
    }
    
    console.log(`Buscando anúncios da conta ${adAccountId}`);
    
    // Verificar se temos dados em cache
    const cachedData = responseCache.get(`${adAccountId}/ads`, {
      access_token: accessToken,
      fields: 'id,name,status,adset_id,creative,effective_status,created_time,updated_time',
      limit: 50
    });
    
    if (cachedData) {
      return cachedData;
    }
    
    // Gerar appsecret_proof para maior segurança quando possível
    const crypto = require('crypto');
    const appsecretProof = META_APP_SECRET ? crypto
      .createHmac('sha256', META_APP_SECRET)
      .update(accessToken)
      .digest('hex') : null;
    
    const params = {
      access_token: accessToken,
      fields: 'id,name,status,adset_id,creative{id,name,thumbnail_url,image_url,body,title,object_story_spec},effective_status,created_time,updated_time,insights{impressions,clicks,spend}',
      limit: 50
    };
    
    // Adicionar appsecret_proof quando disponível
    if (appsecretProof) {
      params.appsecret_proof = appsecretProof;
    }
    
    // Fazer a requisição para a API do Meta
    const response = await makeMetaApiRequest(adAccountId, async () => {
      return await axios.get(`${META_BASE_URL}/${adAccountId}/ads`, { params });
    });
    
    // Transformar os dados para um formato mais amigável
    const ads = response.data.data.map(ad => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      effectiveStatus: ad.effective_status,
      adsetId: ad.adset_id,
      createdTime: ad.created_time,
      updatedTime: ad.updated_time,
      creative: ad.creative ? {
        id: ad.creative.id,
        name: ad.creative.name,
        thumbnailUrl: ad.creative.thumbnail_url,
        imageUrl: ad.creative.image_url,
        body: ad.creative.body,
        title: ad.creative.title,
        objectStorySpec: ad.creative.object_story_spec
      } : null,
      insights: ad.insights ? {
        impressions: ad.insights.impressions,
        clicks: ad.insights.clicks,
        spend: ad.insights.spend
      } : null
    }));
    
    const result = {
      data: ads,
      paging: response.data.paging || null
    };
    
    // Armazenar em cache
    responseCache.set(`${adAccountId}/ads`, {
      access_token: accessToken,
      fields: 'id,name,status,adset_id,creative,effective_status,created_time,updated_time',
      limit: 50
    }, result);
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error.response?.data || error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar anúncios',
      data: []
    };
  }
};

// Verificar se o token de acesso ainda é válido
exports.validateToken = async (accessToken) => {
  if (!accessToken) {
    console.error('Token de acesso não fornecido para validação');
    return { isValid: false, message: 'Token de acesso não fornecido' };
  }
  
  try {
    console.log('Verificando validade do token de acesso');
    // Tentar fazer uma chamada simples para verificar se o token ainda é válido
    const response = await axios.get(`${META_BASE_URL}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${META_APP_ID}|${META_APP_SECRET}`,
      },
    });
    
    // Verificar se o token é válido e não expirou
    const data = response.data.data;
    if (!data || !data.is_valid) {
      const errorMessage = data?.error?.message || 'Erro desconhecido';
      console.error('Token de acesso inválido:', errorMessage);
      return { isValid: false, message: `Token inválido: ${errorMessage}` };
    }
    
    // Verificar se o token expirou
    if (data.expires_at && data.expires_at * 1000 < Date.now()) {
      console.error('Token de acesso expirado');
      return { isValid: false, message: 'Token expirado' };
    }
    
    console.log('Token de acesso válido');
    return { isValid: true, message: 'Token válido' };
  } catch (error) {
    console.error('Erro ao validar token de acesso:', error.response?.data || error.message);
    return { 
      isValid: false, 
      message: `Erro na validação: ${error.response?.data?.error?.message || error.message}`
    };
  }
};
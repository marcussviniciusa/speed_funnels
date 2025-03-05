const axios = require('axios');
const { ApiConnection } = require('../models');
const createError = require('http-errors');

const META_API_VERSION = 'v16.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Configurações do Meta OAuth
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3001/api/integrations/meta/callback';

// Gerar URL de autorização
exports.getAuthUrl = (state) => {
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
  try {
    const response = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      },
    });

    return {
      accessToken: response.data.access_token,
      // Meta não retorna refresh_token por padrão, usa long-lived tokens
      expiresIn: response.data.expires_in || 5184000, // 60 dias em segundos
    };
  } catch (error) {
    console.error('Erro ao obter token do Meta:', error.response?.data || error.message);
    throw createError(500, 'Erro ao autenticar com Meta: ' + (error.response?.data?.error?.message || error.message));
  }
};

// Obter informações do usuário
exports.getUserInfo = async (accessToken) => {
  try {
    const response = await axios.get(`${META_BASE_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,email',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter informações do usuário Meta:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter dados do usuário Meta');
  }
};

// Obter contas de anúncios disponíveis
exports.getAdAccounts = async (accessToken) => {
  try {
    const response = await axios.get(`${META_BASE_URL}/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_id,account_status,business_name,currency',
      },
    });
    
    // Filtrar apenas contas ativas (account_status == 1)
    return response.data.data.filter(account => account.account_status === 1);
  } catch (error) {
    console.error('Erro ao obter contas de anúncios:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter contas de anúncios Meta');
  }
};

// Buscar métricas de campanhas
exports.getCampaignMetrics = async (accessToken, adAccountId, dateRange) => {
  try {
    const { startDate, endDate } = dateRange;
    
    const response = await axios.get(`${META_BASE_URL}/act_${adAccountId}/insights`, {
      params: {
        access_token: accessToken,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        level: 'campaign',
        fields: 'campaign_name,spend,impressions,clicks,reach,cpm,ctr,cost_per_result',
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Erro ao obter métricas de campanhas:', error.response?.data || error.message);
    throw createError(500, 'Erro ao obter métricas de campanhas Meta');
  }
};

// Verificar se token ainda é válido
exports.validateToken = async (accessToken) => {
  try {
    const response = await axios.get(`${META_BASE_URL}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${META_APP_ID}|${META_APP_SECRET}`,
      },
    });
    
    return {
      valid: response.data.data.is_valid,
      expiresAt: new Date(response.data.data.expires_at * 1000),
    };
  } catch (error) {
    console.error('Erro ao validar token Meta:', error.response?.data || error.message);
    return { valid: false };
  }
}; 
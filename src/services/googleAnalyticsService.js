const { google } = require('googleapis');
const { ApiConnection } = require('../models');
const createError = require('http-errors');

// Configurações do Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/integrations/google/callback';

// Criar cliente OAuth
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Gerar URL de autorização
exports.getAuthUrl = (state) => {
  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent',
  });
};

// Trocar código por tokens
exports.getTokens = async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date,
    };
  } catch (error) {
    console.error('Erro ao obter tokens do Google:', error);
    throw createError(500, 'Erro ao autenticar com Google Analytics');
  }
};

// Obter informações do usuário
exports.getUserInfo = async (accessToken) => {
  try {
    oAuth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();
    return data;
  } catch (error) {
    console.error('Erro ao obter informações do usuário Google:', error);
    throw createError(500, 'Erro ao obter dados do usuário Google');
  }
};

// Listar propriedades do GA4
exports.getAnalyticsProperties = async (accessToken) => {
  try {
    oAuth2Client.setCredentials({ access_token: accessToken });
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oAuth2Client });
    
    const { data } = await analyticsAdmin.properties.list();
    return data.properties || [];
  } catch (error) {
    console.error('Erro ao listar propriedades do Google Analytics:', error);
    throw createError(500, 'Erro ao obter propriedades do Google Analytics');
  }
};

// Obter métricas do GA4
exports.getAnalyticsData = async (accessToken, propertyId, dateRange) => {
  try {
    const { startDate, endDate } = dateRange;
    
    oAuth2Client.setCredentials({ access_token: accessToken });
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oAuth2Client });
    
    const { data } = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionSource' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'engagementRate' },
          { name: 'conversions' },
        ],
      },
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao obter dados do Google Analytics:', error);
    throw createError(500, 'Erro ao obter métricas do Google Analytics');
  }
};

// Atualizar token de acesso usando refresh token
exports.refreshAccessToken = async (refreshToken) => {
  try {
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token,
      expiresIn: credentials.expiry_date,
    };
  } catch (error) {
    console.error('Erro ao atualizar token do Google:', error);
    throw createError(500, 'Erro ao atualizar token do Google Analytics');
  }
}; 
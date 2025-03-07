/**
 * Serviço para gerenciamento de tokens de acesso
 */

// Prefixo para as chaves no localStorage
const TOKEN_PREFIX = 'sf_token_';

/**
 * Armazena um token de acesso no localStorage
 * 
 * @param {string} provider - Provedor do token (meta, google, etc)
 * @param {string} token - Token de acesso
 * @param {number} expiresIn - Tempo de expiração em segundos
 * @param {string} companyId - ID da empresa associada ao token
 */
const storeToken = (provider, token, expiresIn, companyId) => {
  const key = `${TOKEN_PREFIX}${provider}_${companyId}`;
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  const tokenData = {
    token,
    expiresAt,
    provider,
    companyId
  };
  
  localStorage.setItem(key, JSON.stringify(tokenData));
  
  return tokenData;
};

/**
 * Recupera um token de acesso do localStorage
 * 
 * @param {string} provider - Provedor do token
 * @param {string} companyId - ID da empresa associada ao token
 * @returns {Object|null} Dados do token ou null se não existir ou estiver expirado
 */
const getToken = (provider, companyId) => {
  const key = `${TOKEN_PREFIX}${provider}_${companyId}`;
  const tokenDataStr = localStorage.getItem(key);
  
  if (!tokenDataStr) {
    return null;
  }
  
  try {
    const tokenData = JSON.parse(tokenDataStr);
    
    // Verificar se o token expirou
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      // Token expirado, remover do localStorage
      removeToken(provider, companyId);
      return null;
    }
    
    return tokenData;
  } catch (error) {
    console.error('Erro ao processar dados do token:', error);
    return null;
  }
};

/**
 * Remove um token de acesso do localStorage
 * 
 * @param {string} provider - Provedor do token
 * @param {string} companyId - ID da empresa associada ao token
 */
const removeToken = (provider, companyId) => {
  const key = `${TOKEN_PREFIX}${provider}_${companyId}`;
  localStorage.removeItem(key);
};

/**
 * Verifica se um token está válido
 * 
 * @param {string} provider - Provedor do token
 * @param {string} companyId - ID da empresa associada ao token
 * @returns {boolean} True se o token existir e estiver válido
 */
const isTokenValid = (provider, companyId) => {
  const tokenData = getToken(provider, companyId);
  return tokenData !== null;
};

/**
 * Limpa todos os tokens armazenados
 */
const clearAllTokens = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(TOKEN_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Lista todos os tokens armazenados
 * 
 * @returns {Array} Lista de dados de tokens
 */
const listAllTokens = () => {
  const tokens = [];
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(TOKEN_PREFIX)) {
      try {
        const tokenData = JSON.parse(localStorage.getItem(key));
        tokens.push(tokenData);
      } catch (error) {
        console.error(`Erro ao processar token ${key}:`, error);
      }
    }
  });
  
  return tokens;
};

export default {
  storeToken,
  getToken,
  removeToken,
  isTokenValid,
  clearAllTokens,
  listAllTokens
};

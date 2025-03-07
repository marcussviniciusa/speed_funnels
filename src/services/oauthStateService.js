/**
 * Serviço para gerenciamento de estado OAuth
 * 
 * Este serviço gerencia o estado usado no fluxo OAuth para prevenir ataques CSRF
 */

// Prefixo para as chaves no localStorage
const STATE_PREFIX = 'sf_oauth_state_';

// Tempo de expiração do estado em milissegundos (10 minutos)
const STATE_EXPIRATION = 10 * 60 * 1000;

/**
 * Gera um estado aleatório para o fluxo OAuth
 * 
 * @param {string} provider - Provedor OAuth (meta, google, etc)
 * @param {string} companyId - ID da empresa
 * @returns {string} Estado gerado
 */
const generateState = (provider, companyId) => {
  // Gerar um estado aleatório
  const randomState = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
  
  // Criar objeto com informações do estado
  const stateData = {
    provider,
    companyId,
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_EXPIRATION,
    state: randomState
  };
  
  // Armazenar no localStorage
  const key = `${STATE_PREFIX}${randomState}`;
  localStorage.setItem(key, JSON.stringify(stateData));
  
  return randomState;
};

/**
 * Verifica se um estado é válido
 * 
 * @param {string} state - Estado a ser verificado
 * @returns {Object|null} Dados do estado se for válido, null caso contrário
 */
const verifyState = (state) => {
  if (!state) {
    return null;
  }
  
  const key = `${STATE_PREFIX}${state}`;
  const stateDataStr = localStorage.getItem(key);
  
  if (!stateDataStr) {
    return null;
  }
  
  try {
    const stateData = JSON.parse(stateDataStr);
    
    // Verificar se o estado expirou
    if (stateData.expiresAt < Date.now()) {
      // Estado expirado, remover do localStorage
      localStorage.removeItem(key);
      return null;
    }
    
    // Estado válido, remover do localStorage para evitar reutilização
    localStorage.removeItem(key);
    
    return {
      provider: stateData.provider,
      companyId: stateData.companyId
    };
  } catch (error) {
    console.error('Erro ao processar dados do estado:', error);
    return null;
  }
};

/**
 * Limpa estados expirados
 */
const cleanupExpiredStates = () => {
  const now = Date.now();
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STATE_PREFIX)) {
      try {
        const stateData = JSON.parse(localStorage.getItem(key));
        
        if (stateData.expiresAt < now) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error(`Erro ao processar estado ${key}:`, error);
      }
    }
  });
};

export default {
  generateState,
  verifyState,
  cleanupExpiredStates
};

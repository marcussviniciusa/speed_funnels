import api from './api';

/**
 * Serviço para gerenciar integrações com plataformas externas
 */
const integrationService = {
  /**
   * Obtém todas as integrações da empresa
   * @returns {Promise} Promise com os dados das integrações
   */
  getIntegrations: () => {
    return api.get('/api/integrations');
  },

  /**
   * Inicia o processo de integração com o Meta Ads
   * @returns {Promise} Promise com a URL de autorização
   */
  startMetaIntegration: () => {
    return api.get('/api/integrations/meta/auth');
  },

  /**
   * Inicia o processo de integração com o Google Analytics
   * @returns {Promise} Promise com a URL de autorização
   */
  startGoogleIntegration: () => {
    return api.get('/api/integrations/google/auth');
  },

  /**
   * Desativa uma integração
   * @param {string} platform - Plataforma a ser desativada (meta, google)
   * @returns {Promise} Promise com o resultado da operação
   */
  disableIntegration: (platform) => {
    return api.delete(`/api/integrations/${platform}`);
  },

  /**
   * Obtém métricas do Meta Ads
   * @param {string} adAccountId - ID da conta de anúncios
   * @param {Object} dateRange - Período de datas para as métricas
   * @returns {Promise} Promise com os dados das métricas
   */
  getMetaMetrics: (adAccountId, dateRange) => {
    return api.get(`/api/integrations/meta/metrics/${adAccountId}`, {
      params: dateRange
    });
  },

  /**
   * Obtém métricas do Google Analytics
   * @param {string} propertyId - ID da propriedade do GA4
   * @param {Object} dateRange - Período de datas para as métricas
   * @returns {Promise} Promise com os dados das métricas
   */
  getGoogleMetrics: (propertyId, dateRange) => {
    return api.get(`/api/integrations/google/metrics/${propertyId}`, {
      params: dateRange
    });
  },

  /**
   * Obtém contas de anúncios disponíveis no Meta Ads
   * @returns {Promise} Promise com a lista de contas de anúncios
   */
  getMetaAdAccounts: () => {
    return api.get('/api/integrations/meta/accounts');
  },

  /**
   * Obtém propriedades disponíveis no Google Analytics
   * @returns {Promise} Promise com a lista de propriedades
   */
  getGoogleProperties: () => {
    return api.get('/api/integrations/google/properties');
  }
};

export default integrationService;

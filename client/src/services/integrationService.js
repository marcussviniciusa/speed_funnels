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
    return api.get('/api/integrations/meta/auth/1'); // Usando ID da empresa 1 como padrão
  },

  /**
   * Conecta diretamente com o Meta Ads usando um token de acesso
   * @param {string} accessToken - Token de acesso do Meta Ads
   * @param {string} companyId - ID da empresa (opcional, padrão é 1)
   * @returns {Promise} Promise com o resultado da operação
   */
  connectMetaWithToken: (accessToken, companyId = '1') => {
    return api.post(`/api/integrations/meta/connect/${companyId}`, { accessToken });
  },

  /**
   * Inicia o processo de integração com o Google Analytics
   * @returns {Promise} Promise com a URL de autorização
   */
  startGoogleIntegration: () => {
    return api.get('/api/integrations/google/auth/1'); // Usando ID da empresa 1 como padrão
  },

  /**
   * Desativa uma integração
   * @param {string} integrationId - ID da integração a ser desativada
   * @returns {Promise} Promise com o resultado da operação
   */
  disableIntegration: (integrationId) => {
    return api.put(`/api/integrations/${integrationId}/disable`);
  },

  /**
   * Obtém métricas do Meta Ads
   * @param {string} adAccountId - ID da conta de anúncios
   * @param {Object} dateRange - Período de datas para as métricas
   * @returns {Promise} Promise com os dados das métricas
   */
  getMetaMetrics: (adAccountId, dateRange) => {
    return api.get(`/api/metrics/meta/${adAccountId}`, {
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
    return api.get(`/api/metrics/google/${propertyId}`, {
      params: dateRange
    });
  },

  /**
   * Obtém contas de anúncios disponíveis no Meta Ads
   * @returns {Promise} Promise com a lista de contas de anúncios
   */
  getMetaAdAccounts: () => {
    return api.get('/api/metrics/meta/accounts');
  },

  /**
   * Obtém propriedades disponíveis no Google Analytics
   * @returns {Promise} Promise com a lista de propriedades
   */
  getGoogleProperties: () => {
    return api.get('/api/metrics/google/properties');
  }
};

export default integrationService;

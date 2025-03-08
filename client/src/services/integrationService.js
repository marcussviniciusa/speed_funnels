import api from './api';

/**
 * Serviço para gerenciar integrações com plataformas externas
 */
const integrationService = {
  /**
   * Busca todas as integrações ativas do usuário
   */
  getIntegrations: async () => {
    return await api.get('/api/integrations');
  },

  /**
   * Busca métricas do Facebook para um determinado período
   */
  getFacebookMetrics: async (dateRange) => {
    return await api.get('/api/metrics/facebook', { params: dateRange });
  },

  /**
   * Inicia o processo de integração com o Meta Ads para uma empresa específica
   * @param {string} companyId - ID da empresa
   */
  startMetaIntegrationForCompany: async (companyId) => {
    return await api.get(`/api/integrations/meta/auth/${companyId}`);
  },

  /**
   * Sincroniza dados do Meta para uma empresa específica
   * @param {string} companyId - ID da empresa
   */
  syncCompanyMetaData: async (companyId) => {
    return await api.post(`/api/integrations/company/${companyId}/sync`);
  },

  /**
   * Sincroniza dados para uma conexão específica
   * @param {string} connectionId - ID da conexão
   */
  syncConnectionData: async (connectionId) => {
    return await api.post(`/api/integrations/connection/${connectionId}/sync`);
  },

  /**
   * Busca a lista de empresas disponíveis para o usuário
   */
  getCompanies: async () => {
    return await api.get('/api/companies');
  },
  
  /**
   * Busca as contas de anúncios do Meta para uma empresa específica
   * @param {string} companyId - ID da empresa
   */
  getMetaAdAccounts: async (companyId) => {
    return await api.get(`/api/metrics/meta/accounts/company/${companyId}`);
  },

  /**
   * Sincroniza uma conta de anúncios do Meta específica
   * @param {string} companyId - ID da empresa
   * @param {string} adAccountId - ID da conta de anúncios
   */
  syncMetaAdAccount: async (companyId, adAccountId) => {
    return await api.post('/api/integrations/sync/ad-account', {
      companyId,
      adAccountId
    });
  }
};

export default integrationService;

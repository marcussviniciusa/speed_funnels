import api from './api';

/**
 * Serviço para dados do dashboard
 */
const dashboardService = {
  /**
   * Obtém as estatísticas gerais do dashboard
   * 
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com as estatísticas
   */
  getStats: (params = {}) => {
    return api.get('/dashboard/stats', { params });
  },

  /**
   * Obtém os dados de conversão para o gráfico de funil
   * 
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com os dados do funil
   */
  getFunnelData: (params = {}) => {
    return api.get('/dashboard/funnel', { params });
  },

  /**
   * Obtém os dados de tendência para o gráfico de linha
   * 
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com os dados de tendência
   */
  getTrendData: (params = {}) => {
    return api.get('/dashboard/trend', { params });
  },

  /**
   * Obtém os dados de desempenho por canal
   * 
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com os dados de desempenho por canal
   */
  getChannelData: (params = {}) => {
    return api.get('/dashboard/channels', { params });
  },

  /**
   * Obtém os dados de desempenho por campanha
   * 
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com os dados de desempenho por campanha
   */
  getCampaignData: (params = {}) => {
    return api.get('/dashboard/campaigns', { params });
  },

  /**
   * Obtém os relatórios recentes
   * 
   * @param {number} limit - Limite de relatórios a serem retornados
   * @returns {Promise} - Promise com os relatórios recentes
   */
  getRecentReports: (limit = 5) => {
    return api.get('/dashboard/recent-reports', { params: { limit } });
  }
};

export default dashboardService;

import api from './api';

/**
 * Serviço para gerenciamento de relatórios
 */
const reportService = {
  /**
   * Obtém todos os relatórios com paginação e filtros
   * 
   * @param {Object} params - Parâmetros de consulta
   * @param {number} params.page - Número da página (0-indexed)
   * @param {number} params.pageSize - Tamanho da página
   * @param {string} params.sortBy - Campo para ordenação
   * @param {string} params.sortOrder - Direção da ordenação (asc, desc)
   * @param {string} params.status - Filtro por status
   * @param {string} params.search - Termo de busca
   * @returns {Promise} - Promise com os dados dos relatórios
   */
  getReports: (params = {}) => {
    return api.get('/reports', { params });
  },

  /**
   * Obtém um relatório pelo ID
   * 
   * @param {string} id - ID do relatório
   * @returns {Promise} - Promise com os dados do relatório
   */
  getReportById: (id) => {
    return api.get(`/reports/${id}`);
  },

  /**
   * Cria um novo relatório
   * 
   * @param {Object} reportData - Dados do relatório
   * @returns {Promise} - Promise com os dados do relatório criado
   */
  createReport: (reportData) => {
    return api.post('/reports', reportData);
  },

  /**
   * Atualiza um relatório existente
   * 
   * @param {string} id - ID do relatório
   * @param {Object} reportData - Dados do relatório
   * @returns {Promise} - Promise com os dados do relatório atualizado
   */
  updateReport: (id, reportData) => {
    return api.put(`/reports/${id}`, reportData);
  },

  /**
   * Exclui um relatório
   * 
   * @param {string} id - ID do relatório
   * @returns {Promise} - Promise com o resultado da exclusão
   */
  deleteReport: (id) => {
    return api.delete(`/reports/${id}`);
  },

  /**
   * Gera um relatório
   * 
   * @param {string} id - ID do relatório
   * @returns {Promise} - Promise com o resultado da geração
   */
  generateReport: (id) => {
    return api.post(`/reports/${id}/generate`);
  },

  /**
   * Obtém o PDF de um relatório
   * 
   * @param {string} id - ID do relatório
   * @returns {Promise} - Promise com o blob do PDF
   */
  getReportPdf: (id) => {
    return api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
  },

  /**
   * Obtém as métricas de um relatório
   * 
   * @param {string} id - ID do relatório
   * @param {Object} params - Parâmetros de consulta (datas, etc.)
   * @returns {Promise} - Promise com as métricas do relatório
   */
  getReportMetrics: (id, params = {}) => {
    return api.get(`/reports/${id}/metrics`, { params });
  }
};

export default reportService;

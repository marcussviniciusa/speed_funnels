import api from './api';

/**
 * Serviço para gerenciar as configurações do usuário
 */
const settingsService = {
  /**
   * Obtém as configurações da conta do usuário
   * @returns {Promise<Object>} Configurações da conta
   */
  getAccountSettings: async () => {
    try {
      const response = await api.get('/settings/account');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações da conta:', error);
      throw error;
    }
  },

  /**
   * Salva as configurações da conta do usuário
   * @param {Object} settings - Configurações da conta
   * @returns {Promise<Object>} Configurações atualizadas
   */
  saveAccountSettings: async (settings) => {
    try {
      const response = await api.put('/settings/account', settings);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar configurações da conta:', error);
      throw error;
    }
  },

  /**
   * Obtém as configurações de notificações do usuário
   * @returns {Promise<Object>} Configurações de notificações
   */
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/settings/notifications');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações de notificações:', error);
      throw error;
    }
  },

  /**
   * Salva as configurações de notificações do usuário
   * @param {Object} settings - Configurações de notificações
   * @returns {Promise<Object>} Configurações atualizadas
   */
  saveNotificationSettings: async (settings) => {
    try {
      const response = await api.put('/settings/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
      throw error;
    }
  },

  /**
   * Obtém as integrações do usuário
   * @returns {Promise<Object>} Integrações
   */
  getIntegrations: async () => {
    try {
      const response = await api.get('/settings/integrations');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter integrações:', error);
      throw error;
    }
  },

  /**
   * Salva uma integração específica
   * @param {string} integrationType - Tipo de integração (facebook, google, instagram, analytics)
   * @param {Object} integrationData - Dados da integração
   * @returns {Promise<Object>} Integração atualizada
   */
  saveIntegration: async (integrationType, integrationData) => {
    try {
      const response = await api.put(`/settings/integrations/${integrationType}`, integrationData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao salvar integração ${integrationType}:`, error);
      throw error;
    }
  },

  /**
   * Remove uma integração específica
   * @param {string} integrationType - Tipo de integração (facebook, google, instagram, analytics)
   * @returns {Promise<Object>} Resultado da operação
   */
  deleteIntegration: async (integrationType) => {
    try {
      const response = await api.delete(`/settings/integrations/${integrationType}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao remover integração ${integrationType}:`, error);
      throw error;
    }
  }
};

export default settingsService;

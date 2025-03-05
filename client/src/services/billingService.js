import api from './api';

/*
 * SERVIÇO EM DESENVOLVIMENTO
 * 
 * Este serviço de faturamento está em desenvolvimento e não está ativo no momento.
 * As APIs do backend ainda precisam ser implementadas para que este serviço funcione corretamente.
 */

/**
 * Serviço para gerenciar assinaturas e faturamento
 */
const billingService = {
  /**
   * Obtém os detalhes da assinatura atual
   * @returns {Promise<Object>} Detalhes da assinatura
   */
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/billing/subscription');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da assinatura:', error);
      throw error;
    }
  },

  /**
   * Obtém os planos disponíveis
   * @returns {Promise<Array>} Lista de planos disponíveis
   */
  getAvailablePlans: async () => {
    try {
      const response = await api.get('/billing/plans');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter planos disponíveis:', error);
      throw error;
    }
  },

  /**
   * Obtém o histórico de faturas
   * @returns {Promise<Array>} Lista de faturas
   */
  getInvoiceHistory: async () => {
    try {
      const response = await api.get('/billing/invoices');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico de faturas:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de uma fatura específica
   * @param {string} invoiceId - ID da fatura
   * @returns {Promise<Object>} Detalhes da fatura
   */
  getInvoiceDetails: async (invoiceId) => {
    try {
      const response = await api.get(`/billing/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da fatura:', error);
      throw error;
    }
  },

  /**
   * Atualiza o plano de assinatura
   * @param {string} planId - ID do novo plano
   * @returns {Promise<Object>} Detalhes da nova assinatura
   */
  updateSubscriptionPlan: async (planId) => {
    try {
      const response = await api.put('/billing/subscription', { planId });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar plano de assinatura:', error);
      throw error;
    }
  },

  /**
   * Cancela a assinatura atual
   * @param {Object} data - Dados para cancelamento (motivo, feedback)
   * @returns {Promise<Object>} Resultado da operação
   */
  cancelSubscription: async (data) => {
    try {
      const response = await api.post('/billing/subscription/cancel', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  },

  /**
   * Atualiza os dados de pagamento
   * @param {Object} paymentData - Novos dados de pagamento
   * @returns {Promise<Object>} Resultado da operação
   */
  updatePaymentMethod: async (paymentData) => {
    try {
      const response = await api.put('/billing/payment-method', paymentData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar dados de pagamento:', error);
      throw error;
    }
  },

  /**
   * Obtém os dados de uso atual
   * @returns {Promise<Object>} Dados de uso
   */
  getUsageData: async () => {
    try {
      const response = await api.get('/billing/usage');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dados de uso:', error);
      throw error;
    }
  }
};

export default billingService;

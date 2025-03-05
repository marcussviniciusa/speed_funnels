import api from './api';

/**
 * Serviço para gerenciar usuários e equipes
 */
const teamService = {
  /**
   * Obtém a lista de membros da equipe
   * @returns {Promise<Array>} Lista de membros da equipe
   */
  getTeamMembers: async () => {
    try {
      const response = await api.get('/team/members');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter membros da equipe:', error);
      throw error;
    }
  },

  /**
   * Obtém detalhes de um membro específico da equipe
   * @param {string} memberId - ID do membro
   * @returns {Promise<Object>} Detalhes do membro
   */
  getTeamMember: async (memberId) => {
    try {
      const response = await api.get(`/team/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes do membro:', error);
      throw error;
    }
  },

  /**
   * Convida um novo membro para a equipe
   * @param {Object} memberData - Dados do novo membro
   * @returns {Promise<Object>} Resultado da operação
   */
  inviteTeamMember: async (memberData) => {
    try {
      const response = await api.post('/team/invite', memberData);
      return response.data;
    } catch (error) {
      console.error('Erro ao convidar membro:', error);
      throw error;
    }
  },

  /**
   * Atualiza as permissões de um membro da equipe
   * @param {string} memberId - ID do membro
   * @param {Object} permissions - Novas permissões
   * @returns {Promise<Object>} Membro atualizado
   */
  updateMemberPermissions: async (memberId, permissions) => {
    try {
      const response = await api.put(`/team/members/${memberId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar permissões do membro:', error);
      throw error;
    }
  },

  /**
   * Remove um membro da equipe
   * @param {string} memberId - ID do membro
   * @returns {Promise<Object>} Resultado da operação
   */
  removeTeamMember: async (memberId) => {
    try {
      const response = await api.delete(`/team/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover membro da equipe:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes da equipe
   * @returns {Promise<Object>} Detalhes da equipe
   */
  getTeamDetails: async () => {
    try {
      const response = await api.get('/team');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da equipe:', error);
      throw error;
    }
  },

  /**
   * Atualiza os detalhes da equipe
   * @param {Object} teamData - Novos dados da equipe
   * @returns {Promise<Object>} Equipe atualizada
   */
  updateTeamDetails: async (teamData) => {
    try {
      const response = await api.put('/team', teamData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar detalhes da equipe:', error);
      throw error;
    }
  },

  /**
   * Obtém os papéis disponíveis para membros da equipe
   * @returns {Promise<Array>} Lista de papéis disponíveis
   */
  getAvailableRoles: async () => {
    try {
      const response = await api.get('/team/roles');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter papéis disponíveis:', error);
      throw error;
    }
  }
};

export default teamService;

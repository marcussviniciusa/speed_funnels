import api from './api';

/**
 * Serviço para autenticação e gerenciamento de usuários
 */
const authService = {
  /**
   * Realiza o login do usuário
   * 
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} - Promise com os dados do usuário e token
   */
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  /**
   * Realiza o registro de um novo usuário
   * 
   * @param {Object} userData - Dados do usuário
   * @returns {Promise} - Promise com os dados do usuário e token
   */
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  /**
   * Obtém os dados do usuário logado
   * 
   * @returns {Promise} - Promise com os dados do usuário
   */
  getProfile: () => {
    return api.get('/auth/profile');
  },

  /**
   * Atualiza os dados do usuário
   * 
   * @param {Object} userData - Dados do usuário
   * @returns {Promise} - Promise com os dados atualizados
   */
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData);
  },

  /**
   * Altera a senha do usuário
   * 
   * @param {Object} passwordData - Dados da senha
   * @param {string} passwordData.currentPassword - Senha atual
   * @param {string} passwordData.newPassword - Nova senha
   * @returns {Promise} - Promise com o resultado da operação
   */
  changePassword: (passwordData) => {
    return api.post('/auth/change-password', passwordData);
  },

  /**
   * Solicita a recuperação de senha
   * 
   * @param {string} email - Email do usuário
   * @returns {Promise} - Promise com o resultado da operação
   */
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  /**
   * Redefine a senha do usuário
   * 
   * @param {string} token - Token de recuperação
   * @param {string} password - Nova senha
   * @returns {Promise} - Promise com o resultado da operação
   */
  resetPassword: (token, password) => {
    return api.post('/auth/reset-password', { token, password });
  },

  /**
   * Verifica se o token é válido
   * 
   * @returns {Promise} - Promise com o resultado da verificação
   */
  verifyToken: () => {
    return api.get('/auth/verify');
  },

  /**
   * Realiza o logout do usuário
   * 
   * @returns {Promise} - Promise com o resultado da operação
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

export default authService;

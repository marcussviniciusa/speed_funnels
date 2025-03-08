import api from './api';

// Dashboard
const getDashboardStats = async () => {
  const response = await api.get('/api/superadmin/dashboard/stats');
  return response.data;
};

// Companies
const getCompanies = async (page = 1, limit = 10, search = '', status = '') => {
  const response = await api.get('/api/superadmin/companies', {
    params: { page, limit, search, status },
  });
  return response.data;
};

const getCompanyById = async (id) => {
  const response = await api.get(`/api/superadmin/companies/${id}`);
  return response.data;
};

const createCompany = async (companyData) => {
  const response = await api.post('/api/superadmin/companies', companyData);
  return response.data;
};

const updateCompany = async (id, companyData) => {
  const response = await api.put(`/api/superadmin/companies/${id}`, companyData);
  return response.data;
};

// Users
const getUsers = async (page = 1, limit = 10, search = '', role = '', companyId = '') => {
  const response = await api.get('/api/superadmin/users', {
    params: { page, limit, search, role, companyId },
  });
  return response.data;
};

const getUserById = async (id) => {
  const response = await api.get(`/api/superadmin/users/${id}`);
  return response.data;
};

const createUser = async (userData) => {
  const response = await api.post('/api/superadmin/users', userData);
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await api.put(`/api/superadmin/users/${id}`, userData);
  return response.data;
};

const transferUser = async (transferData) => {
  const response = await api.post('/api/superadmin/users/transfer', transferData);
  return response.data;
};

export default {
  getDashboardStats,
  
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  
  getUsers,
  getUserById,
  createUser,
  updateUser,
  transferUser
};

/**
 * Constantes utilizadas na aplicação
 */

// Status de relatórios
export const REPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Tipos de relatórios
export const REPORT_TYPES = {
  META: 'meta',
  GOOGLE: 'google',
};

// Tipos de usuários
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Mensagens de erro comuns
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro. Por favor, tente novamente.',
  UNAUTHORIZED: 'Você não está autorizado a acessar este recurso.',
  NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  VALIDATION: 'Verifique os dados informados e tente novamente.',
  SERVER: 'Erro no servidor. Por favor, tente novamente mais tarde.',
  NETWORK: 'Erro de conexão. Verifique sua internet e tente novamente.',
};

// Rotas da aplicação
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  PROFILE: '/profile',
};

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
};

// Configurações de data
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
};

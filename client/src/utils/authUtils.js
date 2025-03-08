/**
 * Utilitários para gerenciamento de autenticação e redirecionamentos
 */

/**
 * Determina para qual rota o usuário deve ser redirecionado com base no seu papel
 * @param {Object} user - Objeto do usuário contendo papel e outras informações
 * @returns {string} - Rota para redirecionamento
 */
export const getRedirectPathForUser = (user) => {
  if (!user) return '/login';
  
  // Redireciona superadmin para o dashboard de superadmin
  if (user.role === 'superadmin') {
    return '/superadmin/dashboard';
  }
  
  // Redireciona usuários normais para o dashboard padrão
  return '/dashboard';
};

/**
 * Verifica se o usuário tem permissão para acessar uma determinada rota
 * @param {Object} user - Objeto do usuário
 * @param {string} requiredRole - Papel necessário para acessar a rota
 * @returns {boolean} - Se o usuário tem permissão
 */
export const hasPermission = (user, requiredRole) => {
  if (!user) return false;
  
  // Superadmins têm acesso a tudo
  if (user.role === 'superadmin') return true;
  
  // Admins têm acesso às rotas de admin e usuário
  if (user.role === 'admin' && ['admin', 'user'].includes(requiredRole)) return true;
  
  // Usuários regulares só têm acesso às rotas de usuário
  if (user.role === 'user' && requiredRole === 'user') return true;
  
  return false;
};

/**
 * Verifica se uma rota é uma rota de superadmin
 * @param {string} path - Caminho da rota 
 * @returns {boolean} - Se a rota é uma rota de superadmin
 */
export const isSuperadminRoute = (path) => {
  return path.startsWith('/superadmin');
};

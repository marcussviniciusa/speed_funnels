/**
 * Formatadores de dados para uso na aplicação
 */

/**
 * Formata um valor para moeda brasileira (R$)
 * @param {number} value - Valor a ser formatado
 * @param {boolean} showSymbol - Se deve mostrar o símbolo R$
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value, showSymbol = true) => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
  
  if (!showSymbol) {
    return formatter.format(value).replace('R$', '').trim();
  }
  
  return formatter.format(value);
};

/**
 * Formata um número com separadores de milhar
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata uma porcentagem
 * @param {number} value - Valor a ser formatado (0.1 = 10%)
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Valor formatado
 */
export const formatPercent = (value, decimals = 2) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formata uma data para o formato brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @param {boolean} showTime - Se deve mostrar a hora
 * @returns {string} Data formatada
 */
export const formatDate = (date, showTime = false) => {
  const d = new Date(date);
  
  if (showTime) {
    return d.toLocaleString('pt-BR');
  }
  
  return d.toLocaleDateString('pt-BR');
};

/**
 * Trunca um texto se for maior que o tamanho especificado
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formata um número de cartão de crédito para exibição
 * @param {string} cardNumber - Número do cartão
 * @returns {string} Número formatado (ex: •••• •••• •••• 1234)
 */
export const formatCreditCard = (cardNumber) => {
  if (!cardNumber) return '';
  
  // Se já for apenas os últimos dígitos
  if (cardNumber.length <= 4) {
    return `•••• •••• •••• ${cardNumber}`;
  }
  
  // Formata o número completo
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
};

/**
 * Formata o status de uma fatura
 * @param {string} status - Status da fatura
 * @returns {string} Status formatado em português
 */
export const formatInvoiceStatus = (status) => {
  const statusMap = {
    'paid': 'Pago',
    'pending': 'Pendente',
    'failed': 'Falha',
    'processing': 'Processando',
    'canceled': 'Cancelado'
  };
  
  return statusMap[status] || status;
};

/**
 * Formata um período de faturamento
 * @param {Date|string} startDate - Data de início
 * @param {Date|string} endDate - Data de fim
 * @returns {string} Período formatado
 */
export const formatBillingPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
};

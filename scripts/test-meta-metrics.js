/**
 * Script para testar a obtenção de métricas do Meta Ads
 * Este script demonstra como usar a API para obter métricas de uma conta de anúncios do Meta
 */

const axios = require('axios');
const readline = require('readline');

// Configuração do readline para entrada interativa
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// URL base da API
const API_BASE_URL = 'http://localhost:3001';

/**
 * Função para formatar valores monetários
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: USD)
 * @returns {string} Valor formatado
 */
function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Função principal que executa o teste de obtenção de métricas
 */
async function testMetaMetrics() {
  console.log('=== Teste de Obtenção de Métricas do Meta Ads ===');
  console.log('Este script irá testar a obtenção de métricas de uma conta de anúncios do Meta.');
  
  try {
    // Obter contas de anúncios disponíveis
    console.log('\nObtendo contas de anúncios disponíveis...');
    const accountsResponse = await axios.get(`${API_BASE_URL}/api/metrics/meta/accounts`);
    
    if (!accountsResponse.data.data || accountsResponse.data.data.length === 0) {
      console.error('Nenhuma conta de anúncios encontrada. Verifique se você está conectado ao Meta Ads.');
      rl.close();
      return;
    }
    
    // Exibir contas disponíveis
    console.log('\nContas de anúncios disponíveis:');
    accountsResponse.data.data.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name} (${account.id})`);
    });
    
    // Solicitar seleção de conta
    rl.question('\nSelecione o número da conta de anúncios: ', async (accountIndex) => {
      const index = parseInt(accountIndex) - 1;
      
      if (isNaN(index) || index < 0 || index >= accountsResponse.data.data.length) {
        console.error('Seleção inválida.');
        rl.close();
        return;
      }
      
      const selectedAccount = accountsResponse.data.data[index];
      console.log(`\nConta selecionada: ${selectedAccount.name} (${selectedAccount.id})`);
      
      // Solicitar período de datas
      rl.question('\nData de início (YYYY-MM-DD): ', async (startDate) => {
        rl.question('Data de fim (YYYY-MM-DD): ', async (endDate) => {
          try {
            console.log(`\nObtendo métricas para o período de ${startDate} a ${endDate}...`);
            
            // Fazer a requisição para a API
            const metricsResponse = await axios.get(`${API_BASE_URL}/api/metrics/meta/${selectedAccount.id}`, {
              params: {
                startDate,
                endDate
              }
            });
            
            // Exibir resultado
            console.log('\n=== Métricas da Conta ===');
            const metrics = metricsResponse.data.data.metrics;
            console.log(`Conta: ${metricsResponse.data.data.account.name}`);
            console.log(`Período: ${metricsResponse.data.data.dateRange.startDate} a ${metricsResponse.data.data.dateRange.endDate}`);
            console.log(`\nGasto total: ${formatCurrency(metrics.spend, selectedAccount.currency)}`);
            console.log(`Impressões: ${metrics.impressions.toLocaleString()}`);
            console.log(`Cliques: ${metrics.clicks.toLocaleString()}`);
            console.log(`CTR: ${metrics.ctr.toFixed(2)}%`);
            console.log(`CPC médio: ${formatCurrency(metrics.cpc, selectedAccount.currency)}`);
            console.log(`Conversões: ${metrics.conversions.toLocaleString()}`);
            console.log(`Custo por conversão: ${formatCurrency(metrics.costPerConversion, selectedAccount.currency)}`);
            
            // Exibir campanhas
            console.log('\n=== Campanhas ===');
            metricsResponse.data.data.campaigns.forEach((campaign, index) => {
              console.log(`\n${index + 1}. ${campaign.name} (${campaign.status})`);
              console.log(`   Gasto: ${formatCurrency(campaign.spend, selectedAccount.currency)}`);
              console.log(`   Impressões: ${campaign.impressions.toLocaleString()}`);
              console.log(`   Cliques: ${campaign.clicks.toLocaleString()}`);
              console.log(`   Conversões: ${campaign.conversions.toLocaleString()}`);
            });
            
          } catch (error) {
            console.error('\nErro ao obter métricas:');
            if (error.response) {
              console.error('Status:', error.response.status);
              console.error('Dados:', error.response.data);
            } else {
              console.error(error.message);
            }
          } finally {
            rl.close();
          }
        });
      });
    });
  } catch (error) {
    console.error('\nErro inesperado:', error.message);
    rl.close();
  }
}

// Executar o teste
testMetaMetrics();

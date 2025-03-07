/**
 * Script para testar a integração direta com o Meta Ads
 * Este script demonstra como usar a API para conectar diretamente com o Meta Ads
 * usando um token de acesso de longa duração.
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
 * Função principal que executa o teste de integração
 */
async function testDirectMetaIntegration() {
  console.log('=== Teste de Integração Direta com Meta Ads ===');
  console.log('Este script irá testar a conexão direta com o Meta Ads usando um token de acesso.');
  
  // Solicitar token de acesso
  rl.question('\nDigite o token de acesso do Meta Ads: ', async (accessToken) => {
    if (!accessToken) {
      console.error('Token de acesso é obrigatório.');
      rl.close();
      return;
    }

    try {
      // Solicitar ID da empresa (opcional)
      rl.question('\nDigite o ID da empresa (ou pressione Enter para usar o padrão "1"): ', async (companyId) => {
        // Usar ID padrão se não for fornecido
        const company = companyId || '1';
        
        console.log(`\nConectando ao Meta Ads para a empresa ${company}...`);
        
        try {
          // Fazer a requisição para a API
          const response = await axios.post(`${API_BASE_URL}/api/integrations/meta/connect/${company}`, {
            accessToken
          });
          
          // Exibir resultado
          console.log('\n=== Resultado da Integração ===');
          console.log('Status:', response.status);
          console.log('Mensagem:', response.data.message);
          console.log('Dados:');
          console.log(JSON.stringify(response.data.data, null, 2));
          
          // Testar obtenção de contas de anúncios
          console.log('\n=== Testando obtenção de contas de anúncios ===');
          const accountsResponse = await axios.get(`${API_BASE_URL}/api/metrics/meta/accounts`);
          
          console.log('Contas de anúncios disponíveis:');
          console.log(JSON.stringify(accountsResponse.data.data, null, 2));
          
        } catch (error) {
          console.error('\nErro ao conectar com o Meta Ads:');
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
    } catch (error) {
      console.error('\nErro inesperado:', error.message);
      rl.close();
    }
  });
}

// Executar o teste
testDirectMetaIntegration();

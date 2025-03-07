#!/usr/bin/env node

/**
 * Script para testar a API do Speed Funnels
 */

const axios = require('axios');

// URL base da API
const API_URL = 'https://speedfunnels.marcussviniciusa.cloud';

// Credenciais de teste
const TEST_EMAIL = 'admin@speedfunnels.online';
const TEST_PASSWORD = 'admin123';

// Função para testar o login
async function testLogin() {
  try {
    console.log(`Testando login com ${TEST_EMAIL}...`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('Detalhes do usuário:');
    console.log(`ID: ${response.data.user.id}`);
    console.log(`Nome: ${response.data.user.name}`);
    console.log(`Email: ${response.data.user.email}`);
    console.log(`Função: ${response.data.user.role}`);
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
    if (error.response?.data) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Função para testar endpoint protegido
async function testProtectedEndpoint(token) {
  if (!token) {
    console.error('❌ Não foi possível testar endpoint protegido: token não disponível');
    return;
  }
  
  try {
    console.log('\nTestando acesso a endpoint protegido...');
    
    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Acesso ao endpoint protegido bem-sucedido!');
    console.log('Dados do usuário:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erro ao acessar endpoint protegido:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
    if (error.response?.data) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Função para testar a rota raiz
async function testRootEndpoint() {
  try {
    console.log('\nTestando acesso à rota raiz...');
    
    const response = await axios.get(API_URL);
    
    console.log('✅ Acesso à rota raiz bem-sucedido!');
    console.log(`Status: ${response.status}`);
    console.log(`Tipo de conteúdo: ${response.headers['content-type']}`);
  } catch (error) {
    console.error('❌ Erro ao acessar rota raiz:', error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

// Função principal
async function main() {
  console.log('=== Teste da API Speed Funnels ===');
  console.log(`URL da API: ${API_URL}\n`);
  
  // Testar rota raiz
  await testRootEndpoint();
  
  // Testar login
  const token = await testLogin();
  
  // Testar endpoint protegido
  if (token) {
    await testProtectedEndpoint(token);
  }
  
  console.log('\n=== Teste concluído ===');
}

// Executar a função principal
main().catch(error => {
  console.error('\nErro inesperado:', error.message);
});

#!/usr/bin/env node

/**
 * Script para verificar o login do usuário no ambiente remoto
 * Este script testa o login do usuário no servidor remoto
 */

const axios = require('axios');
const readline = require('readline');

// URL base da API remota
const API_URL = 'https://speedfunnels.marcussviniciusa.cloud';

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para testar o login
async function testLogin(email, password) {
  try {
    console.log(`Tentando fazer login com ${email} no servidor remoto...`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    console.log('\nLogin realizado com sucesso!');
    console.log('Detalhes do usuário:');
    console.log(`ID: ${response.data.user.id}`);
    console.log(`Nome: ${response.data.user.name}`);
    console.log(`Email: ${response.data.user.email}`);
    console.log(`Função: ${response.data.user.role}`);
    
    // Verificar token JWT
    console.log('\nToken JWT recebido:');
    const token = response.data.token;
    console.log(`${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
    
    // Testar endpoint protegido
    try {
      const userResponse = await axios.get(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('\nAcesso a endpoint protegido bem-sucedido!');
      console.log('Dados do usuário autenticado:');
      console.log(JSON.stringify(userResponse.data, null, 2));
      
      return true;
    } catch (error) {
      console.error('\nErro ao acessar endpoint protegido:', error.response?.data?.message || error.message);
      return false;
    }
    
  } catch (error) {
    console.error('\nErro ao fazer login:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Função principal
async function main() {
  console.log('=== Verificação de Login Remoto ===');
  console.log(`URL da API: ${API_URL}`);
  
  rl.question('Digite o email do usuário: ', (email) => {
    rl.question('Digite a senha do usuário: ', async (password) => {
      const success = await testLogin(email, password);
      
      if (success) {
        console.log('\n✅ Verificação de login concluída com sucesso!');
        console.log('O sistema de autenticação está funcionando corretamente.');
      } else {
        console.log('\n❌ Verificação de login falhou!');
        console.log('Verifique as credenciais e o funcionamento do servidor.');
      }
      
      rl.close();
    });
  });
}

// Executar a função principal
main().catch(error => {
  console.error('Erro:', error);
  rl.close();
});

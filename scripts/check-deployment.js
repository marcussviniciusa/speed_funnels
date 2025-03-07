#!/usr/bin/env node

/**
 * Script para verificar a acessibilidade da aplicação após o deploy
 * Este script testa a conexão com a API e o frontend
 */

const axios = require('axios');
const readline = require('readline');

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para testar a conexão com a API
async function testApiConnection(baseUrl) {
  try {
    console.log(`Testando conexão com a API em ${baseUrl}/api/auth/login...`);
    
    const response = await axios.get(`${baseUrl}/api/auth/login`, {
      validateStatus: false,
      timeout: 5000
    });
    
    console.log(`Status da API: ${response.status} ${response.statusText}`);
    
    if (response.status >= 200 && response.status < 500) {
      console.log('✅ API está acessível!');
      return true;
    } else {
      console.log('❌ API não está respondendo corretamente.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar à API:', error.message);
    return false;
  }
}

// Função para testar a conexão com o frontend
async function testFrontendConnection(baseUrl) {
  try {
    console.log(`Testando conexão com o frontend em ${baseUrl}...`);
    
    const response = await axios.get(baseUrl, {
      validateStatus: false,
      timeout: 5000
    });
    
    console.log(`Status do frontend: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ Frontend está acessível!');
      return true;
    } else {
      console.log('❌ Frontend não está respondendo corretamente.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao frontend:', error.message);
    return false;
  }
}

// Função para verificar redirecionamentos
async function checkRedirects(baseUrl) {
  try {
    console.log(`Verificando redirecionamentos em ${baseUrl}/login...`);
    
    const response = await axios.get(`${baseUrl}/login`, {
      maxRedirects: 0,
      validateStatus: false,
      timeout: 5000
    });
    
    console.log(`Status da rota /login: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ Rota /login está sendo servida corretamente!');
    } else if (response.status === 302 || response.status === 301) {
      console.log(`⚠️ Redirecionamento detectado para: ${response.headers.location}`);
    } else {
      console.log('❌ Rota /login não está respondendo corretamente.');
    }
  } catch (error) {
    if (error.response && (error.response.status === 302 || error.response.status === 301)) {
      console.log(`⚠️ Redirecionamento detectado para: ${error.response.headers.location}`);
    } else {
      console.error('❌ Erro ao verificar redirecionamentos:', error.message);
    }
  }
}

// Função para verificar configurações de CORS
async function checkCors(baseUrl) {
  try {
    console.log(`Verificando configurações de CORS em ${baseUrl}/api/auth/login...`);
    
    const response = await axios.options(`${baseUrl}/api/auth/login`, {
      validateStatus: false,
      timeout: 5000
    });
    
    console.log(`Status da verificação de CORS: ${response.status} ${response.statusText}`);
    
    if (response.headers['access-control-allow-origin']) {
      console.log(`✅ CORS configurado: ${response.headers['access-control-allow-origin']}`);
    } else {
      console.log('⚠️ Cabeçalhos CORS não encontrados.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar CORS:', error.message);
  }
}

// Função principal
async function main() {
  rl.question('Digite a URL da aplicação (ex: https://speedfunnels.com): ', async (baseUrl) => {
    console.log(`\n=== Verificando acessibilidade de ${baseUrl} ===\n`);
    
    await testFrontendConnection(baseUrl);
    console.log('');
    
    await testApiConnection(baseUrl);
    console.log('');
    
    await checkRedirects(baseUrl);
    console.log('');
    
    await checkCors(baseUrl);
    console.log('');
    
    console.log('\n=== Recomendações para solução de problemas ===\n');
    console.log('1. Verifique se o Traefik está configurado corretamente:');
    console.log('   - Certifique-se de que traefik.enable=true para o serviço app');
    console.log('   - Verifique se o Host está configurado corretamente');
    console.log('   - Confirme se a porta 3001 está exposta corretamente');
    console.log('');
    console.log('2. Verifique os logs do contêiner:');
    console.log('   - Use "docker logs <container_id>" para ver os logs da aplicação');
    console.log('   - Procure por erros relacionados ao servimento de arquivos estáticos');
    console.log('');
    console.log('3. Verifique as configurações de rede:');
    console.log('   - Confirme se a rede externa "network_public" existe');
    console.log('   - Verifique se o contêiner está conectado à rede correta');
    console.log('');
    console.log('4. Verifique o DNS e certificados SSL:');
    console.log('   - Confirme se o domínio está apontando para o servidor correto');
    console.log('   - Verifique se os certificados SSL estão válidos');
    
    rl.close();
  });
}

// Executar a função principal
main().catch(error => {
  console.error('Erro:', error);
  rl.close();
});

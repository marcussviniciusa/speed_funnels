#!/usr/bin/env node

/**
 * Script para atualizar a URL da API no frontend
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de ambiente do frontend
const envFilePath = path.join(__dirname, '../client/.env');
const envProdFilePath = path.join(__dirname, '../client/.env.production');

// URL da API
const API_URL = 'https://speedfunnels.marcussviniciusa.cloud';

// Conteúdo do arquivo .env
const envContent = `REACT_APP_API_URL=${API_URL}
`;

// Função para criar ou atualizar arquivo
function createOrUpdateFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Arquivo ${filePath} atualizado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
  }
}

// Criar ou atualizar arquivos de ambiente
console.log('=== Atualizando URL da API no Frontend ===');
console.log(`URL da API: ${API_URL}`);

createOrUpdateFile(envFilePath, envContent);
createOrUpdateFile(envProdFilePath, envContent);

console.log('\nPara aplicar as alterações, você precisa:');
console.log('1. Recompilar o frontend');
console.log('2. Reconstruir a imagem Docker');
console.log('3. Reimplantar a stack no Portainer');

// Criar script de atualização do frontend
const updateScriptPath = path.join(__dirname, 'update-frontend.sh');
const updateScriptContent = `#!/bin/bash

# Script para atualizar o frontend com a nova URL da API

echo "=== Atualizando Frontend do Speed Funnels ==="
echo "URL da API: ${API_URL}"

# Navegar para o diretório do cliente
cd "$(dirname "$0")/../client"

# Instalar dependências
echo -e "\\nInstalando dependências..."
npm install

# Compilar o frontend
echo -e "\\nCompilando o frontend..."
REACT_APP_API_URL="${API_URL}" npm run build

echo -e "\\n✅ Frontend atualizado com sucesso!"
echo "Agora você precisa reconstruir a imagem Docker e reimplantar a stack no Portainer."
`;

// Criar script de atualização
try {
  fs.writeFileSync(updateScriptPath, updateScriptContent);
  fs.chmodSync(updateScriptPath, '755'); // Tornar executável
  console.log(`\n✅ Script de atualização criado: ${updateScriptPath}`);
} catch (error) {
  console.error(`\n❌ Erro ao criar script de atualização:`, error.message);
}

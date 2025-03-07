#!/bin/bash

# Script para atualizar o frontend com a nova URL da API

echo "=== Atualizando Frontend do Speed Funnels ==="
echo "URL da API: https://speedfunnels.marcussviniciusa.cloud"

# Navegar para o diretório do cliente
cd "$(dirname "$0")/../client"

# Instalar dependências
echo -e "\nInstalando dependências..."
npm install

# Compilar o frontend
echo -e "\nCompilando o frontend..."
REACT_APP_API_URL="https://speedfunnels.marcussviniciusa.cloud" npm run build

echo -e "\n✅ Frontend atualizado com sucesso!"
echo "Agora você precisa reconstruir a imagem Docker e reimplantar a stack no Portainer."

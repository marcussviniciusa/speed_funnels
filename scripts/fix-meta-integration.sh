#!/bin/bash

# Script para resolver o problema de permissão na integração com o Meta

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Resolvendo problema de permissão na integração com o Meta ===${NC}"

# Diretório base
BASE_DIR="$(dirname "$0")/.."
cd "$BASE_DIR"

# 1. Verificar permissões do usuário
echo -e "\n${YELLOW}1. Verificando permissões do usuário...${NC}"
node ./scripts/check-user-permissions.js

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao verificar permissões do usuário.${NC}"
  exit 1
fi

# 2. Corrigir o controlador de integração no contêiner
echo -e "\n${YELLOW}2. Corrigindo o controlador de integração no contêiner...${NC}"
./scripts/fix-integration-in-container.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao corrigir o controlador de integração no contêiner.${NC}"
  echo -e "${YELLOW}Tentando atualizar a imagem Docker...${NC}"
else
  echo -e "${GREEN}Controlador de integração corrigido com sucesso no contêiner!${NC}"
  echo -e "${YELLOW}Reiniciando o contêiner...${NC}"
  docker restart speedfunnels_app
  
  echo -e "\n${GREEN}=== Problema resolvido! ===${NC}"
  echo -e "Agora você pode tentar conectar a empresa com o Meta novamente."
  echo -e "Se o problema persistir, tente atualizar a imagem Docker."
  exit 0
fi

# 3. Atualizar a imagem Docker (apenas se a correção no contêiner falhar)
echo -e "\n${YELLOW}3. Atualizando a imagem Docker...${NC}"
./scripts/update-docker-image-v3.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao atualizar a imagem Docker.${NC}"
  exit 1
fi

echo -e "\n${GREEN}=== Problema resolvido! ===${NC}"
echo -e "Agora você pode atualizar manualmente a stack no Portainer:"
echo -e "1. Acesse ${YELLOW}http://77.37.41.106:9000${NC}"
echo -e "2. Navegue até a stack 'speedfunnels'"
echo -e "3. Atualize a imagem para a versão mais recente"
echo -e "4. Reimplante a stack"

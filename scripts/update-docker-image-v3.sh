#!/bin/bash

# Script para atualizar apenas a imagem Docker

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Atualizando Imagem Docker do Speed Funnels ===${NC}"

# Diretório base
BASE_DIR="$(dirname "$0")/.."
cd "$BASE_DIR"

# Configurações
IMAGE_NAME="marcussviniciusa/speed-funnels"
IMAGE_TAG="v1.0.10"

# 1. Construir a imagem Docker
echo -e "\n${YELLOW}1. Construindo imagem Docker (${IMAGE_NAME}:${IMAGE_TAG})...${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao construir a imagem Docker.${NC}"
  exit 1
fi

echo -e "${GREEN}Imagem Docker construída com sucesso!${NC}"

# 2. Enviar a imagem para o Docker Hub
echo -e "\n${YELLOW}2. Enviando imagem para o Docker Hub...${NC}"
echo -e "Fazendo login no Docker Hub..."
echo -n "Digite seu usuário do Docker Hub: "
read DOCKER_USER
echo -n "Digite sua senha do Docker Hub: "
read -s DOCKER_PASSWORD
echo ""

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USER" --password-stdin

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao fazer login no Docker Hub.${NC}"
  exit 1
fi

echo -e "Enviando imagem ${IMAGE_NAME}:${IMAGE_TAG}..."
docker push "${IMAGE_NAME}:${IMAGE_TAG}"

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao enviar a imagem para o Docker Hub.${NC}"
  exit 1
fi

echo -e "${GREEN}Imagem enviada com sucesso!${NC}"

echo -e "\n${GREEN}=== Processo de atualização da imagem concluído! ===${NC}"
echo -e "Agora você pode atualizar manualmente a stack no Portainer:"
echo -e "1. Acesse ${YELLOW}http://77.37.41.106:9000${NC}"
echo -e "2. Navegue até a stack 'speedfunnels'"
echo -e "3. Atualize a imagem para ${YELLOW}${IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo -e "4. Reimplante a stack"

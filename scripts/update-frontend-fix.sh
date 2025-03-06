#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo -e "${YELLOW}Iniciando script de correção do frontend e atualização do stack...${NC}"

# Verificar se está no diretório raiz do projeto
if [ ! -f "package.json" ] || [ ! -d "client" ]; then
  echo -e "${RED}Erro: Este script deve ser executado no diretório raiz do projeto Speed Funnels.${NC}"
  exit 1
fi

# Verificar se o diretório build do cliente existe
if [ ! -d "client/build" ]; then
  echo -e "${YELLOW}Diretório build do cliente não encontrado. Compilando o frontend...${NC}"
  
  cd client
  
  # Verificar se o npm está instalado
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erro: npm não está instalado. Instale o Node.js e npm para continuar.${NC}"
    exit 1
  fi
  
  # Instalar dependências e compilar
  echo -e "${YELLOW}Instalando dependências do cliente...${NC}"
  npm install
  
  echo -e "${YELLOW}Compilando o frontend...${NC}"
  npm run build
  
  if [ ! -d "build" ]; then
    echo -e "${RED}Erro: Falha ao compilar o frontend.${NC}"
    exit 1
  fi
  
  cd ..
  echo -e "${GREEN}Frontend compilado com sucesso!${NC}"
fi

# Construir e publicar a imagem Docker
echo -e "${YELLOW}Construindo e publicando a imagem Docker...${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Erro: Docker não está instalado. Instale o Docker para continuar.${NC}"
  exit 1
fi

# Definir a versão
VERSION="v1.0.4"
REGISTRY_URL="marcussviniciusa"
IMAGE_NAME="speed-funnels"

# Construir a imagem
echo -e "${YELLOW}Construindo imagem Docker ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}...${NC}"
docker build -t ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION} .

# Verificar se a construção foi bem-sucedida
if [ $? -ne 0 ]; then
  echo -e "${RED}Erro: Falha ao construir a imagem Docker.${NC}"
  exit 1
fi

# Publicar a imagem
echo -e "${YELLOW}Publicando imagem no Docker Hub...${NC}"
docker push ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}

# Verificar se a publicação foi bem-sucedida
if [ $? -ne 0 ]; then
  echo -e "${RED}Erro: Falha ao publicar a imagem no Docker Hub. Verifique se você está autenticado (docker login).${NC}"
  exit 1
fi

echo -e "${GREEN}Imagem Docker publicada com sucesso: ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}${NC}"

# Instruções para atualizar o stack no Portainer
echo -e "${YELLOW}Para atualizar o stack no Portainer, siga estas etapas:${NC}"
echo -e "1. Acesse o Portainer em seu navegador"
echo -e "2. Navegue até Stacks e selecione seu stack 'speed-funnels'"
echo -e "3. Clique em 'Edit Stack'"
echo -e "4. Atualize a variável TAG para: ${VERSION}"
echo -e "5. Clique em 'Update the stack'"
echo -e ""
echo -e "${GREEN}As seguintes alterações foram feitas:${NC}"
echo -e "1. Configuração para servir os arquivos estáticos do frontend"
echo -e "2. Correção da porta no Traefik (3000 -> 3001)"
echo -e "3. Correção do problema de senha do banco de dados"
echo -e "4. Publicação de uma nova imagem Docker com as correções"
echo -e ""
echo -e "${YELLOW}Se preferir atualizar automaticamente o stack, execute:${NC}"
echo -e "./scripts/update-stack.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> ${VERSION}"
echo -e ""
echo -e "${GREEN}Script concluído com sucesso!${NC}"

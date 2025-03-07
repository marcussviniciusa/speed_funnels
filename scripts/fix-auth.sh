#!/bin/bash

# Script para corrigir o problema de autenticação no Speed Funnels
# Uso: ./scripts/fix-auth.sh

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo -e "${YELLOW}Iniciando script de correção do problema de autenticação...${NC}"

# Verificar se está no diretório raiz do projeto
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo -e "${RED}Erro: Este script deve ser executado no diretório raiz do projeto Speed Funnels.${NC}"
  exit 1
fi

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Erro: Docker não está instalado. Instale o Docker para continuar.${NC}"
  exit 1
fi

# Definir a versão
VERSION="v1.0.7"
REGISTRY_URL="marcussviniciusa"
IMAGE_NAME="speed-funnels"

# Tornar os scripts executáveis
chmod +x ./scripts/*.js
chmod +x ./scripts/*.sh

# Aplicar correções
echo -e "${YELLOW}Aplicando correções...${NC}"

# Verificar se o script fix-static-serving.js foi executado
if [ ! -f "src/index.js.bak" ]; then
  echo -e "${YELLOW}Aplicando correção para servimento de arquivos estáticos...${NC}"
  node ./scripts/fix-static-serving.js
fi

# Verificar se o script fix-traefik-config.js foi executado
if [ ! -f "portainer-stack.yml.bak" ]; then
  echo -e "${YELLOW}Aplicando correção para configuração do Traefik...${NC}"
  node ./scripts/fix-traefik-config.js
fi

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
echo -e "1. Correção do controlador de autenticação para usar o banco de dados"
echo -e "2. Correção do método de validação de senha"
echo -e "3. Correção do servimento de arquivos estáticos no ambiente Docker"
echo -e "4. Verificação da configuração do Traefik para acesso externo"
echo -e ""
echo -e "${YELLOW}Após o deploy, verifique a acessibilidade da aplicação com:${NC}"
echo -e "node ./scripts/check-deployment.js"
echo -e ""
echo -e "${YELLOW}Se preferir atualizar automaticamente o stack, execute:${NC}"
echo -e "./scripts/update-stack.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> ${VERSION}"
echo -e ""
echo -e "${GREEN}Script concluído com sucesso!${NC}"

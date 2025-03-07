#!/bin/bash

# Script para atualizar a imagem Docker e reimplantar a stack

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Atualizando e Reimplantando Speed Funnels ===${NC}"

# Diretório base
BASE_DIR="$(dirname "$0")/.."
cd "$BASE_DIR"

# Configurações
IMAGE_NAME="marcussviniciusa/speed-funnels"
IMAGE_TAG="v1.0.8"
PORTAINER_URL="http://77.37.41.106:9000"
STACK_NAME="speedfunnels"
STACK_FILE="portainer-stack-direct-db.yml"

# 1. Atualizar o frontend
echo -e "\n${YELLOW}1. Atualizando o frontend...${NC}"
if [ -f "./scripts/update-frontend.sh" ]; then
  ./scripts/update-frontend.sh
else
  echo -e "${RED}Script de atualização do frontend não encontrado.${NC}"
  exit 1
fi

# 2. Construir a imagem Docker
echo -e "\n${YELLOW}2. Construindo imagem Docker (${IMAGE_NAME}:${IMAGE_TAG})...${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao construir a imagem Docker.${NC}"
  exit 1
fi

echo -e "${GREEN}Imagem Docker construída com sucesso!${NC}"

# 3. Enviar a imagem para o Docker Hub
echo -e "\n${YELLOW}3. Enviando imagem para o Docker Hub...${NC}"
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

# 4. Atualizar o arquivo de configuração do Portainer
echo -e "\n${YELLOW}4. Atualizando arquivo de configuração do Portainer...${NC}"
sed -i "s|image: ${IMAGE_NAME}:v[0-9.]*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" "$STACK_FILE"

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao atualizar o arquivo de configuração.${NC}"
  exit 1
fi

echo -e "${GREEN}Arquivo de configuração atualizado com sucesso!${NC}"

# 5. Reimplantar a stack no Portainer
echo -e "\n${YELLOW}5. Reimplantando a stack no Portainer...${NC}"
echo -e "URL do Portainer: ${PORTAINER_URL}"
echo -e "Nome da Stack: ${STACK_NAME}"
echo -e "Arquivo de configuração: ${STACK_FILE}\n"

# Solicitar senha
echo -n "Digite o usuário do Portainer: "
read PORTAINER_USER
echo -n "Digite a senha do Portainer: "
read -s PORTAINER_PASSWORD
echo ""

# Autenticar no Portainer e obter token
echo -e "\n${YELLOW}Autenticando no Portainer...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/auth" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${PORTAINER_USER}\",\"password\":\"${PORTAINER_PASSWORD}\"}")

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"jwt":"[^"]*' | sed 's/"jwt":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Falha na autenticação. Verifique suas credenciais.${NC}"
  exit 1
fi

echo -e "${GREEN}Autenticação bem-sucedida!${NC}"

# Obter ID do endpoint (normalmente 1 para o endpoint local)
echo -e "\n${YELLOW}Obtendo endpoints...${NC}"
ENDPOINTS_RESPONSE=$(curl -s -X GET "${PORTAINER_URL}/api/endpoints" \
  -H "Authorization: Bearer ${TOKEN}")

# Extrair o primeiro endpoint ID (geralmente é o local)
ENDPOINT_ID=$(echo $ENDPOINTS_RESPONSE | grep -o '"Id":[0-9]*' | head -1 | sed 's/"Id"://')

if [ -z "$ENDPOINT_ID" ]; then
  echo -e "${RED}Não foi possível obter o ID do endpoint.${NC}"
  exit 1
fi

echo -e "Usando endpoint ID: ${ENDPOINT_ID}"

# Verificar se a stack já existe
echo -e "\n${YELLOW}Verificando se a stack já existe...${NC}"
STACKS_RESPONSE=$(curl -s -X GET "${PORTAINER_URL}/api/stacks" \
  -H "Authorization: Bearer ${TOKEN}")

STACK_ID=$(echo $STACKS_RESPONSE | grep -o "\"Name\":\"${STACK_NAME}\".*?\"Id\":[0-9]*" | grep -o '"Id":[0-9]*' | sed 's/"Id"://')

# Ler o conteúdo do arquivo YAML
STACK_CONTENT=$(cat $STACK_FILE)

if [ -n "$STACK_ID" ]; then
  # Atualizar stack existente
  echo -e "${YELLOW}Stack ${STACK_NAME} já existe (ID: ${STACK_ID}). Atualizando...${NC}"
  
  UPDATE_RESPONSE=$(curl -s -X PUT "${PORTAINER_URL}/api/stacks/${STACK_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"stackFileContent\":\"${STACK_CONTENT//\"/\\\"}\",\"prune\":true,\"pullImage\":true}")
  
  if [[ $UPDATE_RESPONSE == *"\"Id\":"* ]]; then
    echo -e "${GREEN}Stack atualizada com sucesso!${NC}"
  else
    echo -e "${RED}Falha ao atualizar a stack:${NC}"
    echo $UPDATE_RESPONSE
    exit 1
  fi
else
  # Criar nova stack
  echo -e "${YELLOW}Stack ${STACK_NAME} não existe. Criando...${NC}"
  
  CREATE_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/stacks" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${STACK_NAME}\",\"stackFileContent\":\"${STACK_CONTENT//\"/\\\"}\",\"swarmID\":\"${SWARM_ID}\",\"endpointId\":${ENDPOINT_ID}}")
  
  if [[ $CREATE_RESPONSE == *"\"Id\":"* ]]; then
    echo -e "${GREEN}Stack criada com sucesso!${NC}"
  else
    echo -e "${RED}Falha ao criar a stack:${NC}"
    echo $CREATE_RESPONSE
    exit 1
  fi
fi

echo -e "\n${GREEN}=== Processo de atualização e reimplantação concluído! ===${NC}"
echo -e "Acesse ${YELLOW}${PORTAINER_URL}${NC} para verificar o status da stack."
echo -e "A aplicação estará disponível em ${YELLOW}https://speedfunnels.marcussviniciusa.cloud${NC}"
echo -e "Tente fazer login com as seguintes credenciais:"
echo -e "Email: ${YELLOW}admin@speedfunnels.online${NC}"
echo -e "Senha: ${YELLOW}admin123${NC}"

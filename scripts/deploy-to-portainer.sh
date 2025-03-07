#!/bin/bash

# Script para implantar a stack no Portainer

# Definir variáveis
PORTAINER_URL="http://77.37.41.106:9000"
STACK_NAME="speedfunnels"
STACK_FILE="../portainer-stack-direct-db.yml"
USERNAME="admin"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Implantação da Stack no Portainer ===${NC}"
echo -e "URL do Portainer: ${PORTAINER_URL}"
echo -e "Nome da Stack: ${STACK_NAME}"
echo -e "Arquivo de configuração: ${STACK_FILE}\n"

# Solicitar senha
echo -n "Digite a senha do Portainer: "
read -s PASSWORD
echo ""

# Autenticar no Portainer e obter token
echo -e "\n${YELLOW}Autenticando no Portainer...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/auth" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

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

echo -e "\n${GREEN}=== Implantação concluída! ===${NC}"
echo -e "Acesse ${YELLOW}${PORTAINER_URL}${NC} para verificar o status da stack."
echo -e "A aplicação estará disponível em ${YELLOW}https://speedfunnels.marcussviniciusa.cloud${NC}"

#!/bin/bash

# Script para facilitar o deploy com Portainer usando YAML
# Uso: ./deploy-yaml.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <ENDPOINT_ID>

# Verificar argumentos
if [ "$#" -lt 4 ]; then
    echo "Uso: $0 <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <ENDPOINT_ID>"
    exit 1
fi

PORTAINER_URL=$1
PORTAINER_USERNAME=$2
PORTAINER_PASSWORD=$3
ENDPOINT_ID=$4

echo "Preparando deploy para Portainer em $PORTAINER_URL..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se o curl está instalado
if ! command -v curl &> /dev/null; then
    echo "curl não encontrado. Por favor, instale o curl primeiro."
    exit 1
fi

# Verificar se o arquivo YAML existe
if [ ! -f "portainer-stack.yml" ]; then
    echo "Arquivo portainer-stack.yml não encontrado."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "Arquivo .env não encontrado."
    exit 1
fi

# Construir a imagem Docker
echo "Construindo imagem Docker..."
docker build -t speed-funnels:latest .

# Salvar a imagem como arquivo tar
echo "Salvando imagem Docker como arquivo tar..."
docker save speed-funnels:latest > speed-funnels-latest.tar

# Autenticar no Portainer
echo "Autenticando no Portainer..."
TOKEN=$(curl -s -X POST "${PORTAINER_URL}/api/auth" \
    -H "Content-Type: application/json" \
    -d "{\"Username\":\"${PORTAINER_USERNAME}\",\"Password\":\"${PORTAINER_PASSWORD}\"}" \
    | grep -o '"jwt":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Falha na autenticação com o Portainer. Verifique suas credenciais."
    exit 1
fi

echo "Autenticação bem-sucedida. Token JWT obtido."

# Verificar se o stack já existe
STACKS=$(curl -s -X GET "${PORTAINER_URL}/api/stacks" \
    -H "Authorization: Bearer ${TOKEN}")

STACK_ID=$(echo "$STACKS" | grep -o '"Id":[0-9]*,"Name":"speed-funnels"' | grep -o '"Id":[0-9]*' | grep -o '[0-9]*')

# Fazer upload da imagem para o endpoint
echo "Fazendo upload da imagem Docker para o endpoint..."
curl -X POST "${PORTAINER_URL}/api/endpoints/${ENDPOINT_ID}/docker/images/load" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@speed-funnels-latest.tar"

# Ler variáveis do arquivo .env
echo "Lendo variáveis de ambiente do arquivo .env..."
ENV_VARS=$(grep -v '^#' .env | grep '=' | sed 's/\(.*\)=\(.*\)/{"name":"\1","value":"\2"}/g' | paste -sd "," -)

if [ -z "$STACK_ID" ]; then
    # Criar novo stack
    echo "Criando novo stack 'speed-funnels'..."
    curl -X POST "${PORTAINER_URL}/api/stacks" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"Name\": \"speed-funnels\",
            \"EndpointId\": ${ENDPOINT_ID},
            \"SwarmID\": \"\",
            \"StackFileContent\": \"$(cat portainer-stack.yml | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\",
            \"Env\": [${ENV_VARS}]
        }"
else
    # Atualizar stack existente
    echo "Atualizando stack 'speed-funnels' existente (ID: $STACK_ID)..."
    curl -X PUT "${PORTAINER_URL}/api/stacks/${STACK_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"StackFileContent\": \"$(cat portainer-stack.yml | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\",
            \"Env\": [${ENV_VARS}]
        }"
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm speed-funnels-latest.tar

echo "Deploy concluído com sucesso!"
echo "Acesse o Portainer em $PORTAINER_URL para verificar o status do stack 'speed-funnels'."
echo "A aplicação estará disponível em: https://${DOMAIN_NAME}"

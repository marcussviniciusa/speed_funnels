#!/bin/bash

# Script para facilitar o deploy no Portainer
# Uso: ./deploy-portainer.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>

# Verificar argumentos
if [ "$#" -lt 3 ]; then
    echo "Uso: $0 <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>"
    exit 1
fi

PORTAINER_URL=$1
PORTAINER_USERNAME=$2
PORTAINER_PASSWORD=$3

echo "Preparando deploy para Portainer em $PORTAINER_URL..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se o curl está instalado
if ! command -v curl &> /dev/null; then
    echo "curl não encontrado. Por favor, instale o curl primeiro."
    exit 1
fi

# Verificar se as variáveis de ambiente do Traefik estão configuradas
if ! grep -q "DOMAIN_NAME" .env || ! grep -q "ACME_EMAIL" .env || ! grep -q "TRAEFIK_USERNAME" .env || ! grep -q "TRAEFIK_PASSWORD_HASH" .env; then
    echo "Variáveis de ambiente do Traefik não encontradas no arquivo .env."
    echo "Por favor, configure as seguintes variáveis:"
    echo "  DOMAIN_NAME - Nome de domínio para a aplicação"
    echo "  ACME_EMAIL - Email para o Let's Encrypt"
    echo "  TRAEFIK_USERNAME - Nome de usuário para o dashboard do Traefik"
    echo "  TRAEFIK_PASSWORD_HASH - Hash da senha para o dashboard do Traefik"
    echo ""
    echo "Você pode gerar o hash da senha usando o script:"
    echo "  ./scripts/generate-traefik-password.sh"
    
    read -p "Deseja continuar mesmo assim? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
        exit 1
    fi
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

# Listar endpoints disponíveis
echo "Listando endpoints disponíveis..."
ENDPOINTS=$(curl -s -X GET "${PORTAINER_URL}/api/endpoints" \
    -H "Authorization: Bearer ${TOKEN}")

echo "Endpoints disponíveis:"
echo "$ENDPOINTS" | grep -o '"Id":[0-9]*,"Name":"[^"]*' | sed 's/"Id":\([0-9]*\),"Name":"\([^"]*\)/\1: \2/'

# Solicitar ID do endpoint
read -p "Digite o ID do endpoint para deploy: " ENDPOINT_ID

# Verificar se o stack já existe
STACKS=$(curl -s -X GET "${PORTAINER_URL}/api/stacks" \
    -H "Authorization: Bearer ${TOKEN}")

STACK_ID=$(echo "$STACKS" | grep -o '"Id":[0-9]*,"Name":"speed-funnels"' | grep -o '"Id":[0-9]*' | grep -o '[0-9]*')

# Verificar se a rede traefik-public existe
echo "Verificando se a rede traefik-public existe..."
NETWORKS=$(curl -s -X GET "${PORTAINER_URL}/api/endpoints/${ENDPOINT_ID}/docker/networks" \
    -H "Authorization: Bearer ${TOKEN}")

if ! echo "$NETWORKS" | grep -q '"Name":"traefik-public"'; then
    echo "A rede traefik-public não existe. Criando..."
    curl -s -X POST "${PORTAINER_URL}/api/endpoints/${ENDPOINT_ID}/docker/networks/create" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "Name": "traefik-public",
            "Driver": "overlay",
            "Options": {
                "attachable": "true"
            },
            "CheckDuplicate": true
        }'
    
    if [ $? -ne 0 ]; then
        echo "Falha ao criar a rede traefik-public."
        exit 1
    fi
    
    echo "Rede traefik-public criada com sucesso."
fi

# Preparar arquivo docker-compose.yml e .env
echo "Preparando arquivos para deploy..."
cp docker-compose.yml docker-compose.yml.deploy
cp .env .env.deploy

# Fazer upload da imagem para o endpoint
echo "Fazendo upload da imagem Docker para o endpoint..."
curl -X POST "${PORTAINER_URL}/api/endpoints/${ENDPOINT_ID}/docker/images/load" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@speed-funnels-latest.tar"

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
            \"StackFileContent\": \"$(cat docker-compose.yml.deploy | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\",
            \"Env\": $(cat .env.deploy | grep -v '^#' | grep '=' | sed 's/\(.*\)=\(.*\)/{"name":"\1","value":"\2"}/g' | paste -sd "," -)
        }"
else
    # Atualizar stack existente
    echo "Atualizando stack 'speed-funnels' existente (ID: $STACK_ID)..."
    curl -X PUT "${PORTAINER_URL}/api/stacks/${STACK_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"StackFileContent\": \"$(cat docker-compose.yml.deploy | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\",
            \"Env\": $(cat .env.deploy | grep -v '^#' | grep '=' | sed 's/\(.*\)=\(.*\)/{"name":"\1","value":"\2"}/g' | paste -sd "," -)
        }"
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm speed-funnels-latest.tar docker-compose.yml.deploy .env.deploy

echo "Deploy concluído com sucesso!"
echo "Acesse o Portainer em $PORTAINER_URL para verificar o status do stack 'speed-funnels'."
echo "A aplicação estará disponível em: https://${DOMAIN_NAME}"
echo "O dashboard do Traefik estará disponível em: https://traefik.${DOMAIN_NAME}"

#!/bin/bash

# Script para atualizar o stack no Portainer
# Uso: ./update-stack.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> <TAG>

# Verificar argumentos
if [ "$#" -lt 5 ]; then
    echo "Uso: $0 <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> <TAG>"
    echo "Exemplo: $0 https://portainer.seudominio.com admin senha123 speed-funnels v1.0.1"
    exit 1
fi

PORTAINER_URL=$1
PORTAINER_USERNAME=$2
PORTAINER_PASSWORD=$3
STACK_NAME=$4
TAG=$5

echo "Atualizando stack $STACK_NAME no Portainer com a tag $TAG..."

# Obter token de autenticação
echo "Obtendo token de autenticação..."
TOKEN=$(curl -s -X POST "$PORTAINER_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$PORTAINER_USERNAME\",\"password\":\"$PORTAINER_PASSWORD\"}" | grep -o '"jwt":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Falha ao obter token de autenticação. Verifique suas credenciais."
    exit 1
fi

# Obter ID do endpoint (assumindo que é o endpoint 1)
ENDPOINT_ID=1

# Obter ID do stack
echo "Obtendo ID do stack $STACK_NAME..."
STACK_ID=$(curl -s -X GET "$PORTAINER_URL/api/stacks" \
  -H "Authorization: Bearer $TOKEN" | grep -o "\"Id\":[0-9]*,\"Name\":\"$STACK_NAME\"" | grep -o "\"Id\":[0-9]*" | grep -o "[0-9]*")

if [ -z "$STACK_ID" ]; then
    echo "Stack $STACK_NAME não encontrado."
    exit 1
fi

echo "Stack ID: $STACK_ID"

# Obter configuração atual do stack
echo "Obtendo configuração atual do stack..."
STACK_CONFIG=$(curl -s -X GET "$PORTAINER_URL/api/stacks/$STACK_ID" \
  -H "Authorization: Bearer $TOKEN")

# Extrair variáveis de ambiente atuais
ENV_VARS=$(echo $STACK_CONFIG | grep -o '"Env":\[[^]]*\]' | sed 's/"Env"://')

# Atualizar a variável TAG
if echo $ENV_VARS | grep -q "\"name\":\"TAG\""; then
    # Substituir o valor da variável TAG
    NEW_ENV_VARS=$(echo $ENV_VARS | sed "s/\"name\":\"TAG\",\"value\":\"[^\"]*\"/\"name\":\"TAG\",\"value\":\"$TAG\"/g")
else
    # Adicionar a variável TAG se não existir
    if [ "$ENV_VARS" = "[]" ]; then
        NEW_ENV_VARS="[{\"name\":\"TAG\",\"value\":\"$TAG\"}]"
    else
        NEW_ENV_VARS=$(echo $ENV_VARS | sed "s/\]/,{\"name\":\"TAG\",\"value\":\"$TAG\"}\]/")
    fi
fi

# Atualizar o stack
echo "Atualizando o stack com a nova tag..."
UPDATE_RESPONSE=$(curl -s -X PUT "$PORTAINER_URL/api/stacks/$STACK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"Env\":$NEW_ENV_VARS,\"Prune\":true}")

if echo $UPDATE_RESPONSE | grep -q "\"Id\":$STACK_ID"; then
    echo "Stack atualizado com sucesso para a tag $TAG."
else
    echo "Falha ao atualizar o stack. Resposta:"
    echo $UPDATE_RESPONSE
    exit 1
fi

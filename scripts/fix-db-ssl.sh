#!/bin/bash

# Script para corrigir o problema de SSL no banco de dados
# Uso: ./fix-db-ssl.sh <DOCKERHUB_USERNAME> [TAG]

# Verificar argumentos
if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <DOCKERHUB_USERNAME> [TAG]"
    echo "Exemplo: $0 seuusuario v1.0.1"
    exit 1
fi

DOCKERHUB_USERNAME=$1
TAG=${2:-latest}

echo "=== Iniciando processo de correção do problema de SSL no banco de dados ==="

# Verificar se a variável DB_SSL está no .env
if ! grep -q "DB_SSL=" .env; then
    echo "Adicionando variável DB_SSL ao arquivo .env..."
    echo "DB_SSL=false" >> .env
    echo "Variável DB_SSL adicionada ao arquivo .env."
else
    echo "Variável DB_SSL já está presente no arquivo .env."
fi

# Verificar se a configuração de SSL foi atualizada no arquivo database.js
if ! grep -q "process.env.DB_SSL" src/config/database.js; then
    echo "Atualizando configuração de SSL no arquivo database.js..."
    # Backup do arquivo
    cp src/config/database.js src/config/database.js.bak
    # Atualizar a configuração
    sed -i 's/ssl: {/ssl: process.env.DB_SSL === '\''true'\'' ? {/' src/config/database.js
    sed -i 's/rejectUnauthorized: false,/rejectUnauthorized: false,} : false,/' src/config/database.js
    echo "Configuração de SSL atualizada no arquivo database.js."
else
    echo "Configuração de SSL já está atualizada no arquivo database.js."
fi

# Publicar a imagem no Docker Hub
echo "Publicando imagem atualizada no Docker Hub..."
./scripts/publish-dockerhub.sh "$DOCKERHUB_USERNAME" "$TAG"

if [ $? -ne 0 ]; then
    echo "Falha ao publicar a imagem no Docker Hub."
    exit 1
fi

echo "=== Processo de correção do problema de SSL no banco de dados concluído ==="
echo ""
echo "Para atualizar o stack no Portainer, use o script update-stack.sh:"
echo "./scripts/update-stack.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> $TAG"
echo ""
echo "Ou atualize manualmente no Portainer:"
echo "1. Acesse o Portainer"
echo "2. Vá para 'Stacks' e selecione seu stack"
echo "3. Adicione a variável DB_SSL=false"
echo "4. Atualize a variável TAG para: $TAG"
echo "5. Clique em 'Update the stack'"

#!/bin/bash

# Script para corrigir problemas e atualizar a imagem no Docker Hub
# Uso: ./fix-and-update.sh <DOCKERHUB_USERNAME> [TAG]

# Verificar argumentos
if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <DOCKERHUB_USERNAME> [TAG]"
    echo "Exemplo: $0 seuusuario v1.0.1"
    exit 1
fi

DOCKERHUB_USERNAME=$1
TAG=${2:-latest}

echo "=== Iniciando processo de correção e atualização ==="

# Verificar se o módulo handlebars está no package.json
if ! grep -q '"handlebars":' package.json; then
    echo "Adicionando módulo handlebars ao package.json..."
    # Backup do package.json
    cp package.json package.json.bak
    # Adicionar handlebars após googleapis
    sed -i '/"googleapis":/a \ \ \ \ "handlebars": "^4.7.8",' package.json
    echo "Módulo handlebars adicionado ao package.json."
else
    echo "Módulo handlebars já está presente no package.json."
fi

# Publicar a imagem no Docker Hub
echo "Publicando imagem atualizada no Docker Hub..."
./scripts/publish-dockerhub.sh "$DOCKERHUB_USERNAME" "$TAG"

if [ $? -ne 0 ]; then
    echo "Falha ao publicar a imagem no Docker Hub."
    exit 1
fi

echo "=== Processo de correção e atualização concluído ==="
echo ""
echo "Para atualizar o stack no Portainer, use o script update-stack.sh:"
echo "./scripts/update-stack.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <STACK_NAME> $TAG"
echo ""
echo "Ou atualize manualmente no Portainer:"
echo "1. Acesse o Portainer"
echo "2. Vá para 'Stacks' e selecione seu stack"
echo "3. Atualize a variável TAG para: $TAG"
echo "4. Clique em 'Update the stack'"

#!/bin/bash

# Script para construir e publicar a imagem no Docker Hub
# Uso: ./publish-dockerhub.sh <DOCKERHUB_USERNAME> [TAG]

# Verificar argumentos
if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <DOCKERHUB_USERNAME> [TAG]"
    echo "Exemplo: $0 seuusuario v1.0.0"
    exit 1
fi

DOCKERHUB_USERNAME=$1
TAG=${2:-latest}
IMAGE_NAME="$DOCKERHUB_USERNAME/speed-funnels:$TAG"

echo "Preparando para publicar a imagem $IMAGE_NAME no Docker Hub..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar login no Docker Hub
echo "Verificando login no Docker Hub..."
if ! docker info | grep -q "Username: $DOCKERHUB_USERNAME"; then
    echo "Você não está logado no Docker Hub como $DOCKERHUB_USERNAME."
    echo "Por favor, faça login usando: docker login"
    
    # Tentar fazer login
    echo "Tentando fazer login no Docker Hub..."
    docker login
    
    # Verificar se o login foi bem-sucedido
    if [ $? -ne 0 ]; then
        echo "Falha ao fazer login no Docker Hub. Por favor, tente novamente manualmente."
        exit 1
    fi
fi

# Construir a imagem Docker
echo "Construindo imagem Docker..."
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "Falha ao construir a imagem Docker."
    exit 1
fi

# Publicar a imagem no Docker Hub
echo "Publicando imagem $IMAGE_NAME no Docker Hub..."
docker push $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "Falha ao publicar a imagem no Docker Hub."
    exit 1
fi

echo "Imagem publicada com sucesso no Docker Hub: $IMAGE_NAME"
echo ""
echo "Para usar esta imagem no seu arquivo YAML, defina a variável REGISTRY_URL:"
echo "REGISTRY_URL=$DOCKERHUB_USERNAME"
echo ""
echo "Ou atualize diretamente a linha 'image:' no arquivo portainer-stack.yml:"
echo "image: $DOCKERHUB_USERNAME/speed-funnels:$TAG"

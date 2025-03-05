#!/bin/bash

# Script para gerar o hash da senha para o Traefik
# Uso: ./generate-traefik-password.sh [username] [password]

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar argumentos
if [ "$#" -lt 2 ]; then
    # Solicitar username e password se não fornecidos como argumentos
    read -p "Digite o nome de usuário: " username
    read -s -p "Digite a senha: " password
    echo
else
    username=$1
    password=$2
fi

# Gerar o hash da senha usando o contêiner do Apache
echo "Gerando hash da senha para o usuário '$username'..."
hash=$(docker run --rm httpd:alpine htpasswd -nbB "$username" "$password")

# Exibir o hash
echo -e "\nHash gerado:"
echo "$hash"

# Escapar caracteres especiais para uso no docker-compose.yml
escaped_hash=$(echo "$hash" | sed 's/\$/\$\$/g')
echo -e "\nHash escapado para docker-compose.yml:"
echo "$escaped_hash"

# Instruções para uso
echo -e "\nAdicione a seguinte linha ao seu arquivo .env:"
echo "TRAEFIK_PASSWORD_HASH=$escaped_hash"
echo -e "\nOu use diretamente nas labels do Traefik:"
echo "traefik.http.middlewares.traefik-auth.basicauth.users=$escaped_hash"

#!/bin/bash

# Script para criar o primeiro login no sistema Speed Funnels
# Uso: ./scripts/create-first-login.sh <nome> <email> <senha> [role]
# Exemplo: ./scripts/create-first-login.sh "Admin" "admin@example.com" "senha123" "admin"

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

# Verificar argumentos
if [ "$#" -lt 3 ]; then
    echo -e "${RED}Erro: Argumentos insuficientes.${NC}"
    echo -e "Uso: $0 <nome> <email> <senha> [role]"
    echo -e "Exemplo: $0 \"Admin\" \"admin@example.com\" \"senha123\" \"admin\""
    exit 1
fi

NAME="$1"
EMAIL="$2"
PASSWORD="$3"
ROLE="${4:-admin}"  # Default para admin se não especificado

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Erro: Docker não está instalado. Instale o Docker para continuar.${NC}"
    exit 1
fi

# Obter o ID do contêiner da aplicação
echo -e "${YELLOW}Procurando o contêiner da aplicação Speed Funnels...${NC}"
CONTAINER_ID=$(docker ps --filter "name=speed-funnels" --filter "ancestor=marcussviniciusa/speed-funnels" --format "{{.ID}}")

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}Erro: Não foi possível encontrar o contêiner da aplicação Speed Funnels.${NC}"
    echo -e "Certifique-se de que o contêiner está em execução.${NC}"
    exit 1
fi

echo -e "${GREEN}Contêiner encontrado: $CONTAINER_ID${NC}"

# Criar o script temporário dentro do contêiner
echo -e "${YELLOW}Criando o primeiro usuário...${NC}"
docker exec -it $CONTAINER_ID node scripts/create-admin-user.js "$NAME" "$EMAIL" "$PASSWORD" "$ROLE"

if [ $? -ne 0 ]; then
    echo -e "${RED}Erro: Falha ao criar o usuário.${NC}"
    exit 1
fi

echo -e "${GREEN}Processo concluído com sucesso!${NC}"
echo -e "${GREEN}Você pode fazer login no sistema usando:${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}"
echo -e "Senha: ${YELLOW}$PASSWORD${NC}"
echo -e "Role: ${YELLOW}$ROLE${NC}"

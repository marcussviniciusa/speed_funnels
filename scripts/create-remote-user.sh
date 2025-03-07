#!/bin/bash

# Script para criar um usuário no contêiner remoto no Portainer
# Uso: ./scripts/create-remote-user.sh <CONTAINER_NAME> <NOME> <EMAIL> <SENHA> [ROLE]
# Exemplo: ./scripts/create-remote-user.sh speed-funnels_app "Admin" "admin@example.com" "senha123" "superadmin"

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

# Verificar argumentos
if [ "$#" -lt 4 ]; then
    echo -e "${RED}Erro: Argumentos insuficientes.${NC}"
    echo -e "Uso: $0 <CONTAINER_NAME> <NOME> <EMAIL> <SENHA> [ROLE]"
    echo -e "Exemplo: $0 speed-funnels_app \"Admin\" \"admin@example.com\" \"senha123\" \"superadmin\""
    exit 1
fi

CONTAINER_NAME="$1"
NAME="$2"
EMAIL="$3"
PASSWORD="$4"
ROLE="${5:-admin}"  # Default para admin se não especificado

# Verificar se o SSH está instalado
if ! command -v ssh &> /dev/null; then
    echo -e "${RED}Erro: SSH não está instalado. Instale o SSH para continuar.${NC}"
    exit 1
fi

echo -e "${YELLOW}Este script irá ajudá-lo a criar um usuário no contêiner remoto.${NC}"
echo -e "${YELLOW}Siga estas instruções:${NC}"
echo -e ""
echo -e "1. Acesse o Portainer no seu navegador"
echo -e "2. Navegue até 'Containers' e encontre o contêiner '$CONTAINER_NAME'"
echo -e "3. Clique no contêiner para ver os detalhes"
echo -e "4. Procure a opção 'Console' ou 'Exec Console'"
echo -e "5. Escolha /bin/sh ou /bin/bash como shell"
echo -e "6. Clique em 'Connect' ou 'Execute'"
echo -e "7. No terminal que aparecer, cole o seguinte comando:"
echo -e ""
echo -e "${GREEN}node scripts/create-admin-user.js \"$NAME\" \"$EMAIL\" \"$PASSWORD\" \"$ROLE\"${NC}"
echo -e ""
echo -e "${YELLOW}Se o comando acima não funcionar, tente:${NC}"
echo -e "${GREEN}cd /app && node scripts/create-admin-user.js \"$NAME\" \"$EMAIL\" \"$PASSWORD\" \"$ROLE\"${NC}"
echo -e ""
echo -e "${YELLOW}Após executar o comando, você deverá ver uma mensagem de sucesso.${NC}"
echo -e "${YELLOW}Em seguida, você poderá fazer login no sistema usando:${NC}"
echo -e "Email: ${GREEN}$EMAIL${NC}"
echo -e "Senha: ${GREEN}$PASSWORD${NC}"
echo -e ""
echo -e "${YELLOW}Se você encontrar algum erro, verifique os logs do contêiner para mais informações.${NC}"

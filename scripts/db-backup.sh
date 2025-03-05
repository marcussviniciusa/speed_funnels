#!/bin/bash

# Script para backup do banco de dados
# Uso: ./db-backup.sh [backup|restore] [arquivo_de_backup]

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Nome do contêiner do banco de dados
DB_CONTAINER="speed-funnels-db"

# Obter variáveis de ambiente do arquivo .env
if [ -f ../.env ]; then
    source ../.env
else
    echo "Arquivo .env não encontrado. Usando valores padrão."
    DB_USER="postgres"
    DB_NAME="speedfunnels"
fi

# Verificar se o contêiner do banco de dados está em execução
if ! docker ps | grep -q $DB_CONTAINER; then
    echo "Contêiner $DB_CONTAINER não está em execução."
    exit 1
fi

# Função para realizar o backup
do_backup() {
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="speedfunnels_backup_$TIMESTAMP.sql"
    
    echo "Realizando backup do banco de dados para $BACKUP_FILE..."
    docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo "Backup concluído com sucesso: $BACKUP_FILE"
        echo "Tamanho do arquivo: $(du -h $BACKUP_FILE | cut -f1)"
    else
        echo "Erro ao realizar o backup."
        exit 1
    fi
}

# Função para restaurar o backup
do_restore() {
    if [ -z "$1" ]; then
        echo "Arquivo de backup não especificado."
        echo "Uso: $0 restore arquivo_de_backup.sql"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        echo "Arquivo de backup não encontrado: $1"
        exit 1
    fi
    
    echo "Restaurando banco de dados a partir de $1..."
    echo "ATENÇÃO: Isso irá substituir todos os dados existentes!"
    read -p "Deseja continuar? (y/n): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Operação cancelada."
        exit 0
    fi
    
    cat $1 | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo "Restauração concluída com sucesso."
    else
        echo "Erro ao restaurar o backup."
        exit 1
    fi
}

# Verificar argumentos
if [ "$1" = "backup" ]; then
    do_backup
elif [ "$1" = "restore" ]; then
    do_restore "$2"
else
    echo "Uso: $0 [backup|restore] [arquivo_de_backup]"
    echo "  backup  - Cria um backup do banco de dados"
    echo "  restore - Restaura um backup do banco de dados"
    exit 1
fi

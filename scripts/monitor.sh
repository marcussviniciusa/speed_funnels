#!/bin/bash

# Script para monitorar e gerenciar contêineres
# Uso: ./monitor.sh <comando> [argumentos]

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Função de ajuda
show_help() {
    echo "Uso: $0 <comando> [argumentos]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  status                    - Mostrar status de todos os contêineres"
    echo "  logs <container> [linhas] - Mostrar logs de um contêiner específico"
    echo "  restart <container>       - Reiniciar um contêiner específico"
    echo "  stop <container>          - Parar um contêiner específico"
    echo "  start <container>         - Iniciar um contêiner específico"
    echo "  traefik-status            - Mostrar status do Traefik"
    echo "  traefik-routes            - Mostrar rotas configuradas no Traefik"
    echo "  traefik-services          - Mostrar serviços configurados no Traefik"
    echo "  traefik-middlewares       - Mostrar middlewares configurados no Traefik"
    echo "  help                      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 status"
    echo "  $0 logs speed-funnels-app 100"
    echo "  $0 restart speed-funnels-app"
    echo "  $0 traefik-status"
}

# Verificar argumentos
if [ "$#" -lt 1 ]; then
    show_help
    exit 1
fi

COMMAND=$1
shift

# Executar comando
case "$COMMAND" in
    status)
        echo "Status dos contêineres:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    logs)
        if [ "$#" -lt 1 ]; then
            echo "Erro: Especifique o nome do contêiner."
            exit 1
        fi
        CONTAINER=$1
        LINES=100
        if [ "$#" -ge 2 ]; then
            LINES=$2
        fi
        echo "Mostrando últimas $LINES linhas de logs do contêiner $CONTAINER:"
        docker logs --tail $LINES -f $CONTAINER
        ;;
    restart)
        if [ "$#" -lt 1 ]; then
            echo "Erro: Especifique o nome do contêiner."
            exit 1
        fi
        CONTAINER=$1
        echo "Reiniciando contêiner $CONTAINER..."
        docker restart $CONTAINER
        ;;
    stop)
        if [ "$#" -lt 1 ]; then
            echo "Erro: Especifique o nome do contêiner."
            exit 1
        fi
        CONTAINER=$1
        echo "Parando contêiner $CONTAINER..."
        docker stop $CONTAINER
        ;;
    start)
        if [ "$#" -lt 1 ]; then
            echo "Erro: Especifique o nome do contêiner."
            exit 1
        fi
        CONTAINER=$1
        echo "Iniciando contêiner $CONTAINER..."
        docker start $CONTAINER
        ;;
    traefik-status)
        echo "Status do Traefik:"
        TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")
        if [ -z "$TRAEFIK_CONTAINER" ]; then
            echo "Traefik não está em execução."
            exit 1
        fi
        docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    traefik-routes)
        echo "Rotas configuradas no Traefik:"
        TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")
        if [ -z "$TRAEFIK_CONTAINER" ]; then
            echo "Traefik não está em execução."
            exit 1
        fi
        echo "Acessando API do Traefik para obter rotas..."
        docker exec $TRAEFIK_CONTAINER wget -qO- http://localhost:8080/api/http/routers | jq '.'
        ;;
    traefik-services)
        echo "Serviços configurados no Traefik:"
        TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")
        if [ -z "$TRAEFIK_CONTAINER" ]; then
            echo "Traefik não está em execução."
            exit 1
        fi
        echo "Acessando API do Traefik para obter serviços..."
        docker exec $TRAEFIK_CONTAINER wget -qO- http://localhost:8080/api/http/services | jq '.'
        ;;
    traefik-middlewares)
        echo "Middlewares configurados no Traefik:"
        TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")
        if [ -z "$TRAEFIK_CONTAINER" ]; then
            echo "Traefik não está em execução."
            exit 1
        fi
        echo "Acessando API do Traefik para obter middlewares..."
        docker exec $TRAEFIK_CONTAINER wget -qO- http://localhost:8080/api/http/middlewares | jq '.'
        ;;
    help)
        show_help
        ;;
    *)
        echo "Comando desconhecido: $COMMAND"
        show_help
        exit 1
        ;;
esac

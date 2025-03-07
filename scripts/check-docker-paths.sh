#!/bin/sh

# Script para verificar os caminhos no contêiner Docker
echo "=== Verificando caminhos no contêiner Docker ==="
echo "Diretório atual: $(pwd)"
echo "Conteúdo do diretório atual:"
ls -la

echo "\nConteúdo do diretório /app:"
ls -la /app

echo "\nConteúdo do diretório /app/client:"
ls -la /app/client

if [ -d "/app/client/build" ]; then
  echo "\nConteúdo do diretório /app/client/build:"
  ls -la /app/client/build
else
  echo "\nDiretório /app/client/build não encontrado!"
fi

echo "\nVerificando variáveis de ambiente:"
echo "NODE_ENV: $NODE_ENV"

echo "\nVerificando portas em uso:"
netstat -tulpn 2>/dev/null || echo "netstat não disponível"

echo "\nVerificando processos em execução:"
ps aux

echo "\n=== Verificação concluída ==="

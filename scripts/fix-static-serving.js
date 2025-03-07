#!/usr/bin/env node

/**
 * Script para corrigir o servimento de arquivos estáticos no ambiente Docker
 * Este script modifica o arquivo index.js para garantir que os arquivos estáticos sejam servidos corretamente
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo index.js
const indexPath = path.join(__dirname, '../src/index.js');

// Backup do arquivo original
const backupPath = `${indexPath}.bak`;
fs.copyFileSync(indexPath, backupPath);
console.log(`Backup do arquivo original criado em: ${backupPath}`);

// Ler o conteúdo do arquivo
let content = fs.readFileSync(indexPath, 'utf8');

// Verificar se o arquivo já contém a configuração corrigida
if (content.includes('process.env.NODE_ENV === \'production\'')) {
  console.log('O arquivo já contém a configuração corrigida.');
  process.exit(0);
}

// Substituir a configuração de servimento de arquivos estáticos
const staticServingRegex = /\/\/ Servir arquivos estáticos do frontend\napp\.use\(express\.static\(path\.join\(__dirname, '\.\.\/client\/build'\)\)\);/;
const newStaticServing = `// Servir arquivos estáticos do frontend
const clientBuildPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../client/build') 
  : path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));
console.log(\`Servindo arquivos estáticos de: \${clientBuildPath}\`);`;

content = content.replace(staticServingRegex, newStaticServing);

// Substituir a configuração de servimento do index.html
const indexHtmlRegex = /\/\/ Rota raiz\napp\.get\('\/', \(req, res\) => {\n  res\.sendFile\(path\.join\(__dirname, '\.\.\/client\/build', 'index\.html'\)\);\n}\);/;
const newIndexHtml = `// Rota raiz
app.get('/', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client/build', 'index.html')
    : path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath);
});`;

content = content.replace(indexHtmlRegex, newIndexHtml);

// Substituir a configuração de servimento do React router
const reactRouterRegex = /\/\/ Rota para servir o frontend React em qualquer outra rota\napp\.get\('\*', \(req, res\) => {\n  res\.sendFile\(path\.join\(__dirname, '\.\.\/client\/build', 'index\.html'\)\);\n}\);/;
const newReactRouter = `// Rota para servir o frontend React em qualquer outra rota
app.get('*', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client/build', 'index.html')
    : path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath);
});`;

content = content.replace(reactRouterRegex, newReactRouter);

// Escrever o conteúdo modificado de volta ao arquivo
fs.writeFileSync(indexPath, content);
console.log('Arquivo index.js atualizado com sucesso!');

// Criar um script para verificar os caminhos no contêiner Docker
const dockerCheckScript = `#!/bin/sh

# Script para verificar os caminhos no contêiner Docker
echo "=== Verificando caminhos no contêiner Docker ==="
echo "Diretório atual: \$(pwd)"
echo "Conteúdo do diretório atual:"
ls -la

echo "\\nConteúdo do diretório /app:"
ls -la /app

echo "\\nConteúdo do diretório /app/client:"
ls -la /app/client

if [ -d "/app/client/build" ]; then
  echo "\\nConteúdo do diretório /app/client/build:"
  ls -la /app/client/build
else
  echo "\\nDiretório /app/client/build não encontrado!"
fi

echo "\\nVerificando variáveis de ambiente:"
echo "NODE_ENV: \$NODE_ENV"

echo "\\nVerificando portas em uso:"
netstat -tulpn 2>/dev/null || echo "netstat não disponível"

echo "\\nVerificando processos em execução:"
ps aux

echo "\\n=== Verificação concluída ==="
`;

const dockerCheckPath = path.join(__dirname, 'check-docker-paths.sh');
fs.writeFileSync(dockerCheckPath, dockerCheckScript);
fs.chmodSync(dockerCheckPath, '755');
console.log(`Script de verificação de caminhos Docker criado em: ${dockerCheckPath}`);

console.log('\nPara aplicar as alterações, siga estas etapas:');
console.log('1. Construa uma nova imagem Docker:');
console.log('   ./scripts/fix-auth.sh');
console.log('2. Atualize o stack no Portainer para usar a nova imagem.');
console.log('3. Após o deploy, execute o script de verificação de acessibilidade:');
console.log('   node scripts/check-deployment.js');
console.log('\nSe ainda houver problemas, você pode verificar os caminhos no contêiner Docker:');
console.log('1. Acesse o contêiner:');
console.log('   docker exec -it <container_id> sh');
console.log('2. Execute o script de verificação:');
console.log('   ./scripts/check-docker-paths.sh');

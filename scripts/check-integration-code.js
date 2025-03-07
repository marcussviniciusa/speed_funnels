#!/usr/bin/env node

/**
 * Script para verificar o código do controlador de integração
 */

const fs = require('fs');
const path = require('path');

// Função para verificar o código do controlador de integração
async function checkIntegrationCode() {
  try {
    console.log('=== Verificando o código do controlador de integração ===');
    
    // Caminho para o código fonte da aplicação
    const appPath = path.join(__dirname, '..', 'src');
    const controllersPath = path.join(appPath, 'controllers');
    const integrationControllerPath = path.join(controllersPath, 'integration.controller.js');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(integrationControllerPath)) {
      console.log(`\n❌ Arquivo não encontrado: ${integrationControllerPath}`);
      console.log('\nO código fonte da aplicação não está disponível localmente.');
      console.log('Vamos criar um patch para corrigir o erro de permissão.');
      
      // Criar o patch
      const patchContent = `
// Patch para corrigir o erro de permissão no controlador de integração
// Aplicar este patch ao arquivo src/controllers/integration.controller.js

// Localizar a função connectMetaWithToken (por volta da linha 448)
// e substituir o código que verifica a permissão:

exports.connectMetaWithToken = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(\`Conectando diretamente com Meta para usuário \${userId} e empresa \${companyId}\`);
    
    // Verificar se o usuário tem permissão para acessar a empresa
    const userCompany = await UserCompany.findOne({
      where: { user_id: userId, company_id: companyId }
    });
    
    // Se não encontrar a relação, verificar se o usuário é admin
    if (!userCompany && req.user.role !== 'admin') {
      throw new ForbiddenError('Você não tem permissão para conectar esta empresa');
    }
    
    // Buscar a empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new NotFoundError('Empresa não encontrada');
    }
    
    // Continuar com o código existente...
`;
      
      // Salvar o patch
      const patchPath = path.join(__dirname, 'integration-controller-patch.txt');
      fs.writeFileSync(patchPath, patchContent);
      
      console.log(`\n✅ Patch criado: ${patchPath}`);
      console.log('\nPara aplicar o patch, você precisará:');
      console.log('1. Modificar o código do controlador de integração no contêiner Docker');
      console.log('2. Reconstruir a imagem Docker');
      console.log('3. Reimplantar a stack no Portainer');
      
      // Criar um script para modificar o código no contêiner
      const scriptContent = `#!/bin/bash

# Script para modificar o código do controlador de integração no contêiner Docker

# Cores para output
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[0;33m'
NC='\\033[0m' # No Color

echo -e "\${YELLOW}=== Modificando o código do controlador de integração ===\${NC}"

# Nome do contêiner
CONTAINER_NAME="speedfunnels_app"

# Verificar se o contêiner está em execução
echo -e "\\n\${YELLOW}Verificando se o contêiner está em execução...\${NC}"
if ! docker ps | grep -q "\${CONTAINER_NAME}"; then
  echo -e "\${RED}Contêiner \${CONTAINER_NAME} não está em execução.\${NC}"
  echo -e "Por favor, certifique-se de que a stack está implantada no Portainer."
  exit 1
fi

echo -e "\${GREEN}Contêiner \${CONTAINER_NAME} está em execução.\${NC}"

# Criar arquivo temporário com o código corrigido
echo -e "\\n\${YELLOW}Criando arquivo temporário com o código corrigido...\${NC}"
cat > /tmp/integration.controller.fix.js << 'EOF'
// Código corrigido para o controlador de integração
// Esta função verifica se o usuário tem permissão para acessar a empresa
// e permite que usuários com função 'admin' acessem qualquer empresa

exports.connectMetaWithToken = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(\`Conectando diretamente com Meta para usuário \${userId} e empresa \${companyId}\`);
    
    // Verificar se o usuário tem permissão para acessar a empresa
    const userCompany = await UserCompany.findOne({
      where: { user_id: userId, company_id: companyId }
    });
    
    // Se não encontrar a relação, verificar se o usuário é admin
    if (!userCompany && req.user.role !== 'admin') {
      throw new ForbiddenError('Você não tem permissão para conectar esta empresa');
    }
    
    // Buscar a empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new NotFoundError('Empresa não encontrada');
    }
    
    // Resto do código existente...
EOF

# Copiar o arquivo para o contêiner
echo -e "\\n\${YELLOW}Copiando o arquivo para o contêiner...\${NC}"
docker cp /tmp/integration.controller.fix.js \${CONTAINER_NAME}:/tmp/

# Aplicar a correção
echo -e "\\n\${YELLOW}Aplicando a correção...\${NC}"
docker exec \${CONTAINER_NAME} bash -c "
  # Localizar o arquivo do controlador
  CONTROLLER_FILE=\$(find /app/src -name 'integration.controller.js')
  
  if [ -z \"\$CONTROLLER_FILE\" ]; then
    echo 'Arquivo do controlador não encontrado.'
    exit 1
  fi
  
  # Fazer backup do arquivo original
  cp \$CONTROLLER_FILE \${CONTROLLER_FILE}.bak
  
  # Localizar a função connectMetaWithToken e substituir o código
  sed -i '/exports.connectMetaWithToken/,/try {/!b;n;n;n;n;n;n;n;n;n;n;n;c\\    const { companyId } = req.params;\\n    const userId = req.user.id;\\n    \\n    console.log(\`Conectando diretamente com Meta para usuário \${userId} e empresa \${companyId}\`);\\n    \\n    // Verificar se o usuário tem permissão para acessar a empresa\\n    const userCompany = await UserCompany.findOne({\\n      where: { user_id: userId, company_id: companyId }\\n    });\\n    \\n    // Se não encontrar a relação, verificar se o usuário é admin\\n    if (!userCompany && req.user.role !== \\'admin\\') {\\n      throw new ForbiddenError(\\'Você não tem permissão para conectar esta empresa\\');\\n    }\\n    \\n    // Buscar a empresa\\n    const company = await Company.findByPk(companyId);\\n    if (!company) {\\n      throw new NotFoundError(\\'Empresa não encontrada\\');\\n    }' \$CONTROLLER_FILE
  
  # Verificar se a substituição foi bem-sucedida
  if grep -q 'Se não encontrar a relação, verificar se o usuário é admin' \$CONTROLLER_FILE; then
    echo 'Correção aplicada com sucesso!'
  else
    echo 'Falha ao aplicar a correção. Restaurando backup...'
    cp \${CONTROLLER_FILE}.bak \$CONTROLLER_FILE
    exit 1
  fi
"

# Verificar o resultado
if [ $? -eq 0 ]; then
  echo -e "\${GREEN}Correção aplicada com sucesso!\${NC}"
  echo -e "\\nAgora você precisa reiniciar o contêiner para que as alterações tenham efeito."
  echo -e "Você pode fazer isso no Portainer ou executando:"
  echo -e "\${YELLOW}docker restart \${CONTAINER_NAME}\${NC}"
else
  echo -e "\${RED}Falha ao aplicar a correção.\${NC}"
  exit 1
fi

# Limpar arquivo temporário
rm /tmp/integration.controller.fix.js

echo -e "\\n\${GREEN}=== Processo concluído ===\${NC}"
`;
      
      // Salvar o script
      const scriptPath = path.join(__dirname, 'fix-integration-in-container.sh');
      fs.writeFileSync(scriptPath, scriptContent);
      fs.chmodSync(scriptPath, '755'); // Tornar executável
      
      console.log(`\n✅ Script criado: ${scriptPath}`);
      console.log('\nPara aplicar a correção diretamente no contêiner, execute:');
      console.log(`./scripts/fix-integration-in-container.sh`);
      
      return;
    }
    
    // Se o arquivo existir, ler o conteúdo
    const content = fs.readFileSync(integrationControllerPath, 'utf8');
    
    // Verificar se o código já inclui a verificação de admin
    const hasAdminCheck = content.includes("req.user.role !== 'admin'");
    
    if (hasAdminCheck) {
      console.log('\n✅ O código já inclui a verificação de admin.');
    } else {
      console.log('\n❌ O código não inclui a verificação de admin.');
      console.log('\nVamos criar um patch para corrigir o erro de permissão.');
      
      // Criar o patch
      const patchContent = `
// Patch para corrigir o erro de permissão no controlador de integração
// Aplicar este patch ao arquivo src/controllers/integration.controller.js

// Localizar a função connectMetaWithToken (por volta da linha 448)
// e substituir o código que verifica a permissão:

exports.connectMetaWithToken = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    console.log(\`Conectando diretamente com Meta para usuário \${userId} e empresa \${companyId}\`);
    
    // Verificar se o usuário tem permissão para acessar a empresa
    const userCompany = await UserCompany.findOne({
      where: { user_id: userId, company_id: companyId }
    });
    
    // Se não encontrar a relação, verificar se o usuário é admin
    if (!userCompany && req.user.role !== 'admin') {
      throw new ForbiddenError('Você não tem permissão para conectar esta empresa');
    }
    
    // Buscar a empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new NotFoundError('Empresa não encontrada');
    }
    
    // Continuar com o código existente...
`;
      
      // Salvar o patch
      const patchPath = path.join(__dirname, 'integration-controller-patch.txt');
      fs.writeFileSync(patchPath, patchContent);
      
      console.log(`\n✅ Patch criado: ${patchPath}`);
      console.log('\nPara aplicar o patch, você precisará:');
      console.log('1. Modificar o código do controlador de integração');
      console.log('2. Reconstruir a imagem Docker');
      console.log('3. Reimplantar a stack no Portainer');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar o código do controlador de integração:', error);
  } finally {
    console.log('\n=== Verificação concluída ===');
  }
}

// Executar a função
checkIntegrationCode();

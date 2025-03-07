#!/usr/bin/env node

/**
 * Script para verificar as rotas da API disponíveis
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: '77.37.41.106',
  port: 5432,
  username: 'postgres',
  password: 'Marcus1911!!Marcus',
  database: 'speedfunnels',
  logging: false
});

async function checkApiRoutes() {
  try {
    console.log('=== Verificando rotas da API ===');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar os contêineres em execução
    console.log('\n📊 Contêineres em execução:');
    try {
      const containers = execSync('docker ps').toString();
      console.log(containers);
    } catch (error) {
      console.log('Não foi possível obter informações dos contêineres Docker.');
    }
    
    // Verificar os logs do contêiner da aplicação
    console.log('\n📋 Logs recentes do contêiner da aplicação:');
    try {
      const logs = execSync('docker logs --tail 50 speedfunnels_app').toString();
      console.log(logs);
    } catch (error) {
      console.log('Não foi possível obter logs do contêiner da aplicação.');
    }
    
    // Verificar as rotas definidas no código
    console.log('\n🔍 Verificando arquivos de rotas:');
    
    // Criar script para verificar as rotas no contêiner
    const checkRoutesScript = `
    #!/bin/bash
    
    # Encontrar todos os arquivos de rotas
    find /app/src -name "*route*.js" -o -name "*routes*.js" | xargs cat | grep -E "router\\.(get|post|put|delete|patch)"
    `;
    
    // Salvar o script temporário
    const tempScriptPath = '/tmp/check-routes.sh';
    fs.writeFileSync(tempScriptPath, checkRoutesScript);
    fs.chmodSync(tempScriptPath, '755');
    
    try {
      // Copiar o script para o contêiner
      execSync(`docker cp ${tempScriptPath} speedfunnels_app:/tmp/check-routes.sh`);
      
      // Executar o script no contêiner
      const routes = execSync('docker exec speedfunnels_app bash /tmp/check-routes.sh').toString();
      console.log(routes);
      
      // Remover o script do contêiner
      execSync('docker exec speedfunnels_app rm /tmp/check-routes.sh');
    } catch (error) {
      console.log('Não foi possível verificar as rotas no contêiner:', error.message);
    }
    
    // Remover o script temporário
    fs.unlinkSync(tempScriptPath);
    
    // Criar script para corrigir as rotas
    console.log('\n📝 Criando script para corrigir as rotas:');
    
    const fixRoutesScript = `#!/bin/bash

# Script para corrigir as rotas da API

# Cores para output
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[0;33m'
NC='\\033[0m' # No Color

echo -e "\${YELLOW}=== Corrigindo rotas da API ===${NC}"

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

# Criar arquivo temporário com as rotas corrigidas
echo -e "\\n\${YELLOW}Criando arquivo temporário com as rotas corrigidas...\${NC}"
cat > /tmp/settings.routes.fix.js << 'EOF'
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticate);

// Rotas de configurações gerais
router.get('/account', settingsController.getAccountSettings);
router.put('/account', settingsController.updateAccountSettings);

// Rotas de notificações
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Rotas de integrações
router.get('/integrations', settingsController.getIntegrationSettings);
router.put('/integrations/:provider', settingsController.updateIntegrationSettings);

module.exports = router;
EOF

# Copiar o arquivo para o contêiner
echo -e "\\n\${YELLOW}Copiando o arquivo para o contêiner...\${NC}"
docker cp /tmp/settings.routes.fix.js \${CONTAINER_NAME}:/tmp/

# Aplicar a correção
echo -e "\\n\${YELLOW}Aplicando a correção...\${NC}"
docker exec \${CONTAINER_NAME} bash -c "
  # Localizar o arquivo de rotas de configurações
  ROUTES_FILE=\$(find /app/src -name 'settings.routes.js')
  
  if [ -z \"\$ROUTES_FILE\" ]; then
    # Se o arquivo não existir, procurar por outros arquivos de rotas
    ROUTES_DIR=\$(find /app/src -name 'routes' -type d | head -1)
    if [ -z \"\$ROUTES_DIR\" ]; then
      echo 'Diretório de rotas não encontrado.'
      exit 1
    fi
    
    # Criar o arquivo de rotas
    ROUTES_FILE=\"\$ROUTES_DIR/settings.routes.js\"
    echo 'Criando novo arquivo de rotas: '\$ROUTES_FILE
  else
    # Fazer backup do arquivo original
    cp \$ROUTES_FILE \${ROUTES_FILE}.bak
    echo 'Arquivo de rotas encontrado: '\$ROUTES_FILE
  fi
  
  # Copiar o arquivo corrigido
  cp /tmp/settings.routes.fix.js \$ROUTES_FILE
  
  # Verificar se a cópia foi bem-sucedida
  if [ \$? -eq 0 ]; then
    echo 'Correção aplicada com sucesso!'
  else
    echo 'Falha ao aplicar a correção.'
    if [ -f \${ROUTES_FILE}.bak ]; then
      cp \${ROUTES_FILE}.bak \$ROUTES_FILE
    fi
    exit 1
  fi
  
  # Criar o controlador de configurações se não existir
  CONTROLLER_DIR=\$(dirname \$ROUTES_FILE | sed 's/routes/controllers/')
  CONTROLLER_FILE=\"\$CONTROLLER_DIR/settings.controller.js\"
  
  if [ ! -f \"\$CONTROLLER_FILE\" ]; then
    echo 'Criando arquivo de controlador: '\$CONTROLLER_FILE
    mkdir -p \$CONTROLLER_DIR
    cat > \$CONTROLLER_FILE << 'EOF2'
/**
 * Controlador de configurações
 */

// Obter configurações da conta
exports.getAccountSettings = async (req, res) => {
  try {
    // Implementação futura
    res.json({ message: 'Configurações da conta' });
  } catch (error) {
    console.error('Erro ao obter configurações da conta:', error);
    res.status(500).json({ error: 'Erro ao obter configurações da conta' });
  }
};

// Atualizar configurações da conta
exports.updateAccountSettings = async (req, res) => {
  try {
    // Implementação futura
    res.json({ message: 'Configurações da conta atualizadas' });
  } catch (error) {
    console.error('Erro ao atualizar configurações da conta:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações da conta' });
  }
};

// Obter configurações de notificações
exports.getNotificationSettings = async (req, res) => {
  try {
    // Implementação futura
    res.json({ message: 'Configurações de notificações' });
  } catch (error) {
    console.error('Erro ao obter configurações de notificações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações de notificações' });
  }
};

// Atualizar configurações de notificações
exports.updateNotificationSettings = async (req, res) => {
  try {
    // Implementação futura
    res.json({ message: 'Configurações de notificações atualizadas' });
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações de notificações' });
  }
};

// Obter configurações de integrações
exports.getIntegrationSettings = async (req, res) => {
  try {
    // Implementação futura
    res.json({ message: 'Configurações de integrações' });
  } catch (error) {
    console.error('Erro ao obter configurações de integrações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações de integrações' });
  }
};

// Atualizar configurações de integrações
exports.updateIntegrationSettings = async (req, res) => {
  try {
    const { provider } = req.params;
    
    // Verificar o provedor
    if (!provider) {
      return res.status(400).json({ error: 'Provedor não especificado' });
    }
    
    // Implementação específica para cada provedor
    switch (provider) {
      case 'facebook':
        // Implementação para Facebook/Meta
        return res.json({ message: \`Configurações de integração do \${provider} atualizadas\` });
      
      default:
        return res.status(400).json({ error: \`Provedor \${provider} não suportado\` });
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações de integrações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações de integrações' });
  }
};
EOF2
  fi
  
  # Verificar se o arquivo principal da aplicação importa as rotas
  APP_FILE=\$(find /app/src -name 'app.js' -o -name 'index.js' | head -1)
  
  if [ -f \"\$APP_FILE\" ]; then
    echo 'Verificando se o arquivo principal importa as rotas: '\$APP_FILE
    
    # Verificar se as rotas já estão importadas
    if ! grep -q 'settings.routes' \$APP_FILE; then
      # Fazer backup do arquivo original
      cp \$APP_FILE \${APP_FILE}.bak
      
      # Adicionar a importação das rotas
      sed -i '/const app = express/a \\n// Importar rotas de configurações\\nconst settingsRoutes = require(\\'\\.\\.\\/routes\\/settings\\.routes\\');' \$APP_FILE
      
      # Adicionar o uso das rotas
      sed -i '/app\\.use/a app.use(\\\"/settings\\\", settingsRoutes);' \$APP_FILE
      
      echo 'Rotas adicionadas ao arquivo principal.'
    else
      echo 'Rotas já estão importadas no arquivo principal.'
    fi
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
rm /tmp/settings.routes.fix.js

echo -e "\\n\${GREEN}=== Processo concluído ===${NC}"
echo -e "Após reiniciar o contêiner, as rotas de configurações estarão disponíveis em:"
echo -e "\${YELLOW}GET /settings/account\${NC} - Obter configurações da conta"
echo -e "\${YELLOW}PUT /settings/account\${NC} - Atualizar configurações da conta"
echo -e "\${YELLOW}GET /settings/notifications\${NC} - Obter configurações de notificações"
echo -e "\${YELLOW}PUT /settings/notifications\${NC} - Atualizar configurações de notificações"
echo -e "\${YELLOW}GET /settings/integrations\${NC} - Obter configurações de integrações"
echo -e "\${YELLOW}PUT /settings/integrations/:provider\${NC} - Atualizar configurações de integrações"
`;
    
    // Salvar o script
    const fixRoutesScriptPath = path.join(__dirname, 'fix-api-routes.sh');
    fs.writeFileSync(fixRoutesScriptPath, fixRoutesScript);
    fs.chmodSync(fixRoutesScriptPath, '755'); // Tornar executável
    
    console.log(`\n✅ Script criado: ${fixRoutesScriptPath}`);
    console.log('\nPara corrigir as rotas da API, execute:');
    console.log(`./scripts/fix-api-routes.sh`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar as rotas da API:', error);
  } finally {
    // Fechar a conexão
    await sequelize.close();
    console.log('\n=== Verificação concluída ===');
  }
}

// Executar a função
checkApiRoutes();

#!/usr/bin/env node

/**
 * Script para corrigir a configuração do Traefik no Portainer
 * Este script modifica o arquivo portainer-stack.yml para garantir que o Traefik esteja configurado corretamente
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Caminho para o arquivo portainer-stack.yml
const stackPath = path.join(__dirname, '../portainer-stack.yml');

// Backup do arquivo original
const backupPath = `${stackPath}.bak`;
fs.copyFileSync(stackPath, backupPath);
console.log(`Backup do arquivo original criado em: ${backupPath}`);

try {
  // Ler o conteúdo do arquivo YAML
  const fileContent = fs.readFileSync(stackPath, 'utf8');
  const stackConfig = yaml.load(fileContent);
  
  // Verificar e corrigir a configuração do Traefik
  const appService = stackConfig.services.app;
  
  if (!appService.deploy.labels) {
    appService.deploy.labels = [];
  }
  
  // Filtrar labels existentes do Traefik
  const traefikLabels = appService.deploy.labels.filter(label => 
    label.startsWith('traefik.')
  );
  
  // Se não houver labels do Traefik ou se estiverem incompletas, adicionar as configurações corretas
  if (traefikLabels.length < 5) {
    console.log('Configuração do Traefik incompleta ou ausente. Adicionando configuração correta...');
    
    // Remover labels existentes do Traefik
    appService.deploy.labels = appService.deploy.labels.filter(label => 
      !label.startsWith('traefik.')
    );
    
    // Adicionar configuração completa do Traefik
    const newTraefikLabels = [
      'traefik.enable=true',
      'traefik.docker.network=network_public',
      'traefik.http.routers.speedfunnels.rule=Host(`${DOMAIN_NAME}`)',
      'traefik.http.routers.speedfunnels.entrypoints=websecure',
      'traefik.http.routers.speedfunnels.tls=true',
      'traefik.http.routers.speedfunnels.tls.certresolver=letsencryptresolver',
      'traefik.http.services.speedfunnels.loadbalancer.server.port=3001'
    ];
    
    appService.deploy.labels = [...appService.deploy.labels, ...newTraefikLabels];
  } else {
    console.log('Configuração do Traefik já está presente e completa.');
  }
  
  // Verificar e corrigir a configuração de rede
  if (!appService.networks || !appService.networks.includes('network_public')) {
    console.log('Configuração de rede incompleta. Adicionando rede network_public...');
    
    if (!appService.networks) {
      appService.networks = [];
    }
    
    if (!appService.networks.includes('internal')) {
      appService.networks.push('internal');
    }
    
    if (!appService.networks.includes('network_public')) {
      appService.networks.push('network_public');
    }
  } else {
    console.log('Configuração de rede já está correta.');
  }
  
  // Verificar e corrigir a configuração de volumes
  if (!stackConfig.volumes || !stackConfig.volumes['db-data']) {
    console.log('Configuração de volumes incompleta. Adicionando volume db-data...');
    
    if (!stackConfig.volumes) {
      stackConfig.volumes = {};
    }
    
    stackConfig.volumes['db-data'] = {
      external: true,
      name: 'speedfunnels_db_data'
    };
  } else {
    console.log('Configuração de volumes já está correta.');
  }
  
  // Verificar e corrigir a configuração de redes
  if (!stackConfig.networks || !stackConfig.networks['network_public']) {
    console.log('Configuração de redes incompleta. Adicionando rede network_public...');
    
    if (!stackConfig.networks) {
      stackConfig.networks = {};
    }
    
    if (!stackConfig.networks['internal']) {
      stackConfig.networks['internal'] = {};
    }
    
    if (!stackConfig.networks['network_public']) {
      stackConfig.networks['network_public'] = {
        external: true,
        name: 'network_public'
      };
    }
  } else {
    console.log('Configuração de redes já está correta.');
  }
  
  // Converter o objeto YAML de volta para string
  const updatedContent = yaml.dump(stackConfig, {
    lineWidth: -1,
    noRefs: true
  });
  
  // Escrever o conteúdo atualizado de volta ao arquivo
  fs.writeFileSync(stackPath, updatedContent);
  console.log('Arquivo portainer-stack.yml atualizado com sucesso!');
  
  console.log('\nPara aplicar as alterações, siga estas etapas:');
  console.log('1. Construa uma nova imagem Docker:');
  console.log('   ./scripts/fix-auth.sh');
  console.log('2. Atualize o stack no Portainer para usar a nova imagem e configuração.');
  console.log('3. Após o deploy, execute o script de verificação de acessibilidade:');
  console.log('   node scripts/check-deployment.js');
  
} catch (error) {
  console.error('Erro ao processar o arquivo YAML:', error);
  process.exit(1);
}

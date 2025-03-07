# Resolução do Problema de Permissão na Integração com o Meta

Este documento explica como resolver o problema de permissão ao tentar conectar uma empresa à integração do Meta no Speed Funnels.

## Problema

Ao tentar conectar a empresa com ID 1 à integração do Meta, ocorre o seguinte erro:

```
ForbiddenError: Você não tem permissão para conectar esta empresa
```

## Causa

O problema ocorre devido a duas questões:

1. **Falta de relação entre o usuário admin e a empresa**: O usuário admin (ID 3) não estava associado à empresa (ID 1) na tabela `user_companies`.

2. **Verificação de permissão no controlador**: O código do controlador de integração não verifica se o usuário tem a função de `admin`, apenas se ele está associado à empresa.

## Solução

Criamos vários scripts para resolver o problema:

### 1. Verificar e corrigir as permissões do usuário

O script `check-user-permissions.js` verifica se o usuário admin (ID 3) tem permissão para a empresa (ID 1) e cria a relação se necessário.

```bash
node ./scripts/check-user-permissions.js
```

### 2. Corrigir o controlador de integração

Existem duas opções para corrigir o controlador de integração:

#### Opção 1: Corrigir diretamente no contêiner

O script `fix-integration-in-container.sh` modifica o código do controlador de integração diretamente no contêiner Docker em execução.

```bash
./scripts/fix-integration-in-container.sh
```

Após executar este script, o contêiner será reiniciado automaticamente.

#### Opção 2: Atualizar a imagem Docker

Se a opção 1 falhar ou se você preferir atualizar a imagem Docker, use o script `update-docker-image-v3.sh`.

```bash
./scripts/update-docker-image-v3.sh
```

Após atualizar a imagem, você precisará reimplantar a stack no Portainer:

1. Acesse http://77.37.41.106:9000
2. Navegue até a stack 'speedfunnels'
3. Atualize a imagem para a versão mais recente
4. Reimplante a stack

### 3. Solução completa

Para executar todas as etapas em sequência, use o script `fix-meta-integration.sh`:

```bash
./scripts/fix-meta-integration.sh
```

Este script tentará primeiro corrigir o problema diretamente no contêiner. Se isso falhar, ele tentará atualizar a imagem Docker.

## Verificação

Após aplicar a solução, tente novamente conectar a empresa à integração do Meta. O erro de permissão não deve mais ocorrer.

## Detalhes técnicos

### Correção no código

O código do controlador de integração foi modificado para verificar se o usuário tem a função de `admin`, além de verificar se ele está associado à empresa:

```javascript
// Verificar se o usuário tem permissão para acessar a empresa
const userCompany = await UserCompany.findOne({
  where: { user_id: userId, company_id: companyId }
});

// Se não encontrar a relação, verificar se o usuário é admin
if (!userCompany && req.user.role !== 'admin') {
  throw new ForbiddenError('Você não tem permissão para conectar esta empresa');
}
```

### Tabela user_companies

A tabela `user_companies` associa usuários a empresas e define suas funções. A estrutura da tabela é:

- `id`: ID da relação
- `user_id`: ID do usuário
- `company_id`: ID da empresa
- `role`: Função do usuário na empresa (ex: 'admin', 'user')
- `created_at`: Data de criação
- `updated_at`: Data de atualização

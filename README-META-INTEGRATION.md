# Speed Funnels - Meta Ads Integration

## Visão Geral

Este documento descreve a integração do Speed Funnels com a plataforma Meta Ads (Facebook Ads), permitindo que os usuários conectem suas contas de anúncios, obtenham métricas e gerem relatórios de desempenho.

## Funcionalidades Implementadas

- **Conexão OAuth**: Fluxo de autorização padrão que redireciona os usuários para o Meta para autenticação.
- **Conexão Direta com Token**: Conexão usando um token de acesso pré-obtido, ideal para uso em ambientes de teste ou quando o fluxo OAuth não é adequado.
- **Obtenção de Contas de Anúncios**: Listagem de todas as contas de anúncios disponíveis para o usuário conectado.
- **Métricas de Desempenho**: Obtenção de métricas detalhadas de campanhas, incluindo gastos, impressões, cliques, conversões e mais.
- **Relatórios Personalizados**: Geração de relatórios com base em períodos de datas específicos.

## Arquitetura

A integração com o Meta Ads foi implementada seguindo uma arquitetura modular:

1. **Backend (Node.js/Express)**:
   - Controlador de integração (`integration.controller.js`)
   - Rotas de integração (`integration.routes.js`)
   - Serviços de métricas e relatórios

2. **Frontend (React)**:
   - Componente de integração OAuth
   - Componente de conexão direta com token (`DirectMetaConnect.js`)
   - Visualização de métricas e relatórios

3. **Scripts de Utilidade**:
   - `connect-meta.js`: Script interativo para conexão com o Meta Ads
   - `test-meta-api.js`: Utilitário para testar a API do Meta Ads
   - `test-direct-meta-integration.js`: Teste de integração direta com token
   - `test-meta-metrics.js`: Teste de obtenção de métricas

## Configuração

### Pré-requisitos

- Conta de desenvolvedor no Meta for Developers
- Aplicativo criado no Meta for Developers com a API de Marketing habilitada
- Token de acesso com as permissões necessárias

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```
META_APP_ID=1082403447223274
META_APP_SECRET=2f7876d06426f849a51202150b3dd55a
META_REDIRECT_URI=http://localhost:3001/api/integrations/meta/callback
```

## Uso

### Conexão OAuth

1. Navegue até a página de Integrações
2. Selecione a aba "Integrações OAuth"
3. Clique em "Conectar" ao lado do Meta Ads
4. Siga o fluxo de autorização do Meta

### Conexão Direta com Token

1. Navegue até a página de Integrações
2. Selecione a aba "Conexão Direta"
3. Insira seu token de acesso do Meta Ads
4. Clique em "Conectar"

### Visualização de Métricas

1. Após conectar, navegue até a página de Relatórios
2. Selecione uma conta de anúncios
3. Defina o período de datas
4. Visualize as métricas e relatórios

## Permissões Necessárias

O token de acesso do Meta Ads deve ter as seguintes permissões:

- `ads_management`
- `ads_read`
- `business_management`
- `public_profile`

## Scripts de Teste

### Teste de Conexão Direta

```bash
node scripts/test-direct-meta-integration.js
```

Este script testa a conexão direta com o Meta Ads usando um token de acesso.

### Teste de Métricas

```bash
node scripts/test-meta-metrics.js
```

Este script testa a obtenção de métricas de uma conta de anúncios do Meta.

## Documentação Adicional

Para informações mais detalhadas, consulte:

- [Guia de Integração com o Meta Ads](./docs/meta-ads-integration.md)
- [Referência da API do Meta Ads](./docs/meta-ads-api-reference.md)

## Limitações Conhecidas

- A implementação atual assume o fornecimento manual do token
- Atualização automática limitada do token
- Validação mínima das permissões do token

## Próximos Passos

- Implementar mecanismo de atualização de token
- Adicionar validação mais robusta de permissões
- Desenvolver estratégia de rotação de token
- Melhorar o tratamento de erros e feedback ao usuário

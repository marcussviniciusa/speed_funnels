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

A integração com o Meta Ads foi implementada seguindo uma arquitetura de múltiplas camadas:

1. **Interface do Usuário**: Componentes React para interação com o usuário
   - `FacebookIntegration.jsx`: Página principal para conexão e gerenciamento da integração
   - `FacebookSDK.jsx`: Componente para carregamento e gerenciamento do SDK do Facebook
   - `FacebookLoginButton.jsx`: Botão personalizado para login com Facebook

2. **Camada de Serviço**: Serviços para comunicação com a API do Meta
   - `metaService.js`: Serviço para autenticação e comunicação com a Graph API
   - `tokenService.js`: Serviço para gerenciamento seguro de tokens
   - `oauthStateService.js`: Serviço para gerenciamento do estado OAuth

3. **Controladores**: Lógica de negócios para processamento de requisições
   - `integration.controller.js`: Controlador para gerenciamento de integrações
   - `settings.controller.js`: Controlador para configurações de conta

4. **Modelos de Dados**: Estruturas para armazenamento de dados
   - `ApiConnection`: Modelo para armazenamento de conexões com APIs externas
   - `Company`: Modelo para empresas dos usuários
   - `UserCompany`: Modelo para associação entre usuários e empresas

## Configuração

### Pré-requisitos

- Conta de desenvolvedor no Meta for Developers (https://developers.facebook.com)
- Aplicativo do Meta configurado com permissões para Ads Management
- Node.js 14+ e npm/yarn

### Configuração do Aplicativo no Meta for Developers

1. Acesse https://developers.facebook.com e crie um novo aplicativo do tipo "Business"
2. Em "Configurações > Básico", anote o ID do Aplicativo e o Segredo do Aplicativo
3. Em "Produtos > Login do Facebook", configure:
   - URI de redirecionamento: `https://seu-dominio.com/api/integrations/meta/callback`
   - Permissões necessárias: `ads_management`, `ads_read`, `business_management`, `public_profile`
4. Em "Produtos > Marketing API", ative a API e configure as permissões necessárias

### Configuração do Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_REDIRECT_URI=https://seu-dominio.com/api/integrations/meta/callback
```

## Uso

### Conectando uma Conta do Facebook

1. Navegue até a página de integrações em `/settings/integrations/facebook`
2. Selecione a empresa para a qual deseja conectar a conta
3. Clique no botão "Conectar com Facebook"
4. Autorize as permissões solicitadas na janela de login do Facebook
5. Após a autorização, você será redirecionado de volta para a aplicação

### Conexão Direta com Token

Para ambientes de teste ou situações onde o fluxo OAuth não é adequado:

1. Obtenha um token de acesso válido do Meta Ads (via Graph API Explorer ou outro método)
2. Navegue até a página de integrações em `/settings/integrations/facebook`
3. Clique em "Conectar com Token"
4. Insira o token de acesso e selecione a empresa
5. Clique em "Conectar"

### Gerenciando Integrações

- **Visualizar Integrações**: Acesse `/settings/integrations` para ver todas as integrações ativas
- **Desativar Integração**: Clique em "Desativar" ao lado da integração que deseja desativar
- **Reconectar**: Se o token expirar, clique em "Reconectar" para iniciar um novo fluxo de autorização

## Segurança

A integração implementa várias medidas de segurança:

1. **Prevenção de CSRF**: Uso de estado seguro para evitar ataques de solicitação forjada entre sites
2. **Armazenamento Seguro de Tokens**: Tokens são armazenados de forma segura no banco de dados
3. **Verificação de Permissões**: Verificação se o usuário tem acesso à empresa antes de permitir a integração
4. **Renovação Automática de Tokens**: Implementação de renovação automática de tokens expirados (quando disponível)

## Solução de Problemas

### Problemas Comuns

1. **Erro "Estado Inválido"**
   - **Causa**: O estado usado no fluxo OAuth expirou ou é inválido
   - **Solução**: Tente novamente o processo de conexão

2. **Erro "Nenhuma Conta de Anúncios Encontrada"**
   - **Causa**: O usuário não tem acesso a nenhuma conta de anúncios no Facebook
   - **Solução**: Verifique se o usuário tem permissões adequadas no Business Manager do Facebook

3. **Erro "Token Expirado"**
   - **Causa**: O token de acesso expirou
   - **Solução**: Reconecte a conta usando o botão "Reconectar"

4. **Erro "Permissões Insuficientes"**
   - **Causa**: O aplicativo não tem as permissões necessárias
   - **Solução**: Verifique se todas as permissões necessárias foram adicionadas no painel do desenvolvedor do Facebook

### Logs e Depuração

Para depurar problemas de integração:

1. Verifique os logs do servidor para mensagens detalhadas
2. Ative o modo de depuração no console do navegador para ver detalhes do SDK do Facebook
3. Use o Graph API Explorer para testar chamadas de API manualmente

## Referências

- [Meta for Developers](https://developers.facebook.com)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Marketing API Reference](https://developers.facebook.com/docs/marketing-apis)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)

## Próximos Passos

- Implementar seleção de conta de anúncios quando o usuário tem múltiplas contas
- Adicionar suporte para renovação automática de tokens de longa duração
- Implementar métricas em tempo real com atualizações automáticas
- Expandir a integração para incluir Instagram Ads

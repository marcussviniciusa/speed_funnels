# Integração com Facebook Ads

Este documento descreve como configurar e usar a integração com o Facebook Ads no Speed Funnels.

## Pré-requisitos

1. Conta de desenvolvedor do Facebook
2. Aplicativo do Facebook configurado como tipo "Business"
3. Permissões adequadas configuradas no aplicativo

## Configuração do Aplicativo no Facebook

1. Acesse o [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo aplicativo ou use um existente
3. Selecione o tipo "Business" para o aplicativo
4. Adicione o produto "Facebook Login" ao seu aplicativo
5. Configure as seguintes configurações:
   - URL do site: `https://seu-dominio.com`
   - URI de redirecionamento OAuth válidos: `https://seu-dominio.com/api/integrations/meta/callback`
   - Desative o login com a API do JavaScript (se não for usar)

## Permissões Necessárias

O aplicativo precisa solicitar as seguintes permissões:
- `ads_management`: Permite gerenciar campanhas publicitárias
- `ads_read`: Permite ler dados de anúncios e campanhas
- `business_management`: Permite acessar contas de negócios
- `public_profile`: Acesso básico ao perfil público (concedido automaticamente)

## Configuração no Speed Funnels

1. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   META_APP_ID=seu_app_id
   META_APP_SECRET=seu_app_secret
   META_REDIRECT_URI=https://seu-dominio.com/api/integrations/meta/callback
   ```

2. Reinicie o servidor para aplicar as alterações

## Fluxo de Autenticação

O fluxo de autenticação segue o padrão OAuth 2.0:

1. Usuário clica em "Conectar com Facebook"
2. É redirecionado para a página de autorização do Facebook
3. Após autorizar, o Facebook redireciona de volta para a URI de callback
4. O servidor troca o código de autorização por um token de acesso
5. O token é armazenado e usado para acessar a API do Facebook Ads

## Endpoints da API

### Iniciar Autenticação
```
GET /api/integrations/meta/auth/:companyId
```

Inicia o processo de autenticação com o Facebook para a empresa especificada.

### Callback de Autenticação
```
GET /api/integrations/meta/callback
```

Endpoint para receber o código de autorização do Facebook.

### Conectar com Token Manual
```
POST /api/integrations/meta/connect/:companyId
```

Permite conectar uma conta do Facebook usando um token de acesso obtido manualmente.

### Gerenciar Integrações
```
GET /api/settings/integrations
```

Retorna todas as integrações configuradas para o usuário atual.

## Interface de Usuário

A interface de usuário para gerenciar integrações com o Facebook está disponível em:
```
/settings/integrations/facebook
```

Nesta página, os usuários podem:
- Conectar novas contas do Facebook
- Visualizar contas conectadas
- Desativar integrações existentes
- Reconectar contas

## Solução de Problemas

### Erro de Permissões
Se o usuário receber um erro de permissões negadas, verifique:
- Se o aplicativo do Facebook tem as permissões necessárias configuradas
- Se o usuário concedeu todas as permissões solicitadas
- Se o aplicativo passou pela revisão do Facebook (necessário para aplicativos em produção)

### Erro de Redirecionamento
Se houver erros de redirecionamento:
- Verifique se a URI de redirecionamento está corretamente configurada no Facebook
- Verifique se a variável `META_REDIRECT_URI` está correta no arquivo `.env`

### Token Inválido
Se o token de acesso for inválido:
- Verifique se o token não expirou (tokens do Facebook geralmente duram 60 dias)
- Tente reconectar a conta para obter um novo token

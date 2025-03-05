# Deploy Rápido no Portainer com YAML

Este é um guia rápido para fazer o deploy do projeto Speed Funnels no Portainer usando um arquivo YAML, assumindo que você já tem o Portainer e o Traefik instalados.

## Opção 1: Deploy Automatizado

Use o script de deploy automatizado:

```bash
./scripts/deploy-yaml.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <ENDPOINT_ID>
```

Exemplo:
```bash
./scripts/deploy-yaml.sh https://portainer.example.com admin SuaSenha 1
```

## Opção 2: Deploy Manual

### 1. Acessar o Portainer

Acesse a interface web do Portainer e faça login.

### 2. Criar um Novo Stack

1. No menu lateral, clique em **Stacks**
2. Clique no botão **Add stack**
3. Dê um nome ao stack: `speed-funnels`
4. Em **Build method**, selecione **Web editor**
5. Cole o conteúdo do arquivo `portainer-stack.yml` no editor
6. Adicione as variáveis de ambiente necessárias
7. Clique em **Deploy the stack**

## Variáveis de Ambiente Necessárias

| Nome | Descrição | Exemplo |
|------|-----------|---------|
| `DOMAIN_NAME` | Nome de domínio para a aplicação | seu-dominio.com |
| `DB_USER` | Usuário do banco de dados | postgres |
| `DB_PASSWORD` | Senha do banco de dados | sua_senha_segura |
| `DB_NAME` | Nome do banco de dados | speedfunnels |
| `META_APP_ID` | ID do aplicativo Meta | seu_app_id |
| `META_APP_SECRET` | Segredo do aplicativo Meta | seu_app_secret |
| `META_REDIRECT_URI` | URI de redirecionamento do Meta | https://seu-dominio.com/api/integrations/meta/callback |
| `JWT_SECRET` | Segredo para assinatura de tokens JWT | sua_chave_jwt_secreta |

## Verificação do Deploy

Após o deploy, a aplicação estará disponível em:
```
https://seu-dominio.com
```

## Documentação Detalhada

Para instruções mais detalhadas, consulte:
- [Guia de Deploy com Portainer usando YAML](docs/portainer-yaml-deploy.md)
- [Deploy Manual no Portainer com Traefik](docs/portainer-manual-deploy.md)

# Deploy Rápido no Portainer

Este guia mostra como fazer o deploy do projeto Speed Funnels no Portainer usando o arquivo YAML.

## Passos para o Deploy

### 1. Preparar o Ambiente

Certifique-se de que você tem:
- Portainer instalado e acessível
- Traefik configurado com o resolver `letsencryptresolver`
- Rede `network_public` já criada
- Volume `speedfunnels_db_data` já criado (ou remova a linha `external: true` para criar automaticamente)

### 2. Preparar as Variáveis de Ambiente

Você precisará definir as seguintes variáveis no Portainer:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DOMAIN_NAME` | Nome de domínio para a aplicação | seu-dominio.com |
| `DB_USER` | Usuário do banco de dados | postgres |
| `DB_PASSWORD` | Senha do banco de dados | sua_senha_segura |
| `DB_NAME` | Nome do banco de dados | speedfunnels |
| `META_APP_ID` | ID do aplicativo Meta | seu_app_id |
| `META_APP_SECRET` | Segredo do aplicativo Meta | seu_app_secret |
| `META_REDIRECT_URI` | URI de redirecionamento do Meta | https://seu-dominio.com/api/integrations/meta/callback |
| `JWT_SECRET` | Segredo para assinatura de tokens JWT | sua_chave_jwt_secreta |

### 3. Fazer o Deploy no Portainer

1. Acesse o Portainer
2. Vá para "Stacks" e clique em "Add stack"
3. Dê um nome ao stack (ex: "speed-funnels")
4. Em "Build method", selecione "Web editor"
5. Cole o conteúdo do arquivo `portainer-stack.yml`
6. Adicione as variáveis de ambiente necessárias na seção "Environment variables"
7. Clique em "Deploy the stack"

### 4. Verificar o Deploy

Após o deploy, você pode verificar:
- Se os contêineres estão em execução na seção "Containers"
- Se o Traefik está roteando corretamente para a aplicação
- Se a aplicação está acessível em `https://seu-dominio.com`

## Notas Importantes

- Este arquivo YAML está configurado para um ambiente Swarm (usando a seção `deploy`)
- A aplicação será executada apenas em nós do tipo "manager" devido à restrição `node.role == manager`
- O certificado SSL será gerenciado pelo Traefik usando o resolver `letsencryptresolver`
- O banco de dados PostgreSQL usará o volume externo `speedfunnels_db_data`

## Solução de Problemas

Se encontrar problemas:

1. Verifique os logs dos contêineres no Portainer
2. Certifique-se de que a rede `network_public` existe e está configurada corretamente
3. Verifique se o Traefik está configurado com o resolver `letsencryptresolver`
4. Certifique-se de que o volume `speedfunnels_db_data` existe ou remova a linha `external: true`

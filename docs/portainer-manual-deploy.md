# Deploy Manual no Portainer com Traefik

Este guia mostra como fazer o deploy manual do projeto Speed Funnels no Portainer com Traefik já configurado.

## Pré-requisitos

- Acesso ao Portainer
- Traefik já instalado e configurado
- Rede `traefik-public` já criada

## Passos para Deploy Manual

### 1. Acessar o Portainer

Acesse a interface web do Portainer (geralmente em `http://seu-servidor:9000` ou `https://portainer.seu-dominio.com`) e faça login.

### 2. Navegar até Stacks

No menu lateral, clique em **Stacks**.

### 3. Adicionar um Novo Stack

Clique no botão **Add stack**.

### 4. Configurar o Stack

1. **Name**: Digite um nome para o stack, por exemplo: `speed-funnels`
2. **Build method**: Selecione **Web editor**
3. **Web editor**: Cole o conteúdo abaixo no editor:

```yaml
version: '3.8'

services:
  app:
    image: ${REGISTRY_URL:-localhost}/speed-funnels:${TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - DB_NAME=${DB_NAME:-speedfunnels}
      - META_APP_ID=${META_APP_ID}
      - META_APP_SECRET=${META_APP_SECRET}
      - META_REDIRECT_URI=${META_REDIRECT_URI}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
      - JWT_SECRET=${JWT_SECRET:-default_jwt_secret}
    networks:
      - internal
      - traefik-public
    labels:
      - traefik.enable=true
      - traefik.http.routers.speedfunnels.rule=Host(`${DOMAIN_NAME}`)
      - traefik.http.routers.speedfunnels.entrypoints=websecure
      - traefik.http.routers.speedfunnels.tls=true
      - traefik.http.routers.speedfunnels.tls.certresolver=letsencrypt
      - traefik.http.services.speedfunnels.loadbalancer.server.port=3000
      - traefik.docker.network=traefik-public

  db:
    image: postgres:14-alpine
    restart: unless-stopped
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}
      - POSTGRES_DB=${DB_NAME:-speedfunnels}
    networks:
      - internal
    labels:
      - traefik.enable=false

networks:
  internal:
  traefik-public:
    external: true

volumes:
  db-data:
```

### 5. Configurar Variáveis de Ambiente

Role para baixo até a seção **Environment variables** e adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `DOMAIN_NAME` | seu-dominio.com |
| `DB_USER` | postgres |
| `DB_PASSWORD` | sua_senha_segura |
| `DB_NAME` | speedfunnels |
| `META_APP_ID` | seu_app_id |
| `META_APP_SECRET` | seu_app_secret |
| `META_REDIRECT_URI` | https://seu-dominio.com/api/integrations/meta/callback |
| `JWT_SECRET` | sua_chave_jwt_secreta |

### 6. Deploy do Stack

Clique no botão **Deploy the stack** na parte inferior da página.

### 7. Verificar o Deploy

Após o deploy, você verá o stack na lista de stacks. Clique no nome do stack para ver os detalhes e verificar se todos os contêineres estão em execução.

## Configuração do Traefik

Se você já tem o Traefik instalado, certifique-se de que ele está configurado corretamente:

1. O Traefik deve estar configurado para usar o Let's Encrypt para certificados SSL
2. O Traefik deve estar configurado para usar a rede `traefik-public`
3. O Traefik deve ter os entrypoints `web` (porta 80) e `websecure` (porta 443) configurados

## Verificar a Configuração do Traefik

Você pode verificar a configuração do Traefik acessando o dashboard do Traefik (geralmente em `https://traefik.seu-dominio.com`).

## Solução de Problemas

### Problema: Contêineres não iniciam

Verifique os logs dos contêineres no Portainer:

1. Vá para **Containers**
2. Encontre o contêiner com problema
3. Clique no nome do contêiner
4. Clique na aba **Logs**

### Problema: Aplicação não está acessível

Verifique se o Traefik está roteando corretamente para a aplicação:

1. Acesse o dashboard do Traefik
2. Verifique se o router `speedfunnels` está listado
3. Verifique se o serviço `speedfunnels` está listado
4. Verifique se o router está usando o certificado SSL correto

### Problema: Certificado SSL não está funcionando

Verifique os logs do Traefik para ver se há erros relacionados ao Let's Encrypt:

```bash
docker logs traefik
```

## Atualização da Aplicação

Para atualizar a aplicação:

1. No Portainer, vá até o stack `speed-funnels`
2. Clique em **Editor**
3. Faça as alterações necessárias no arquivo YAML (se houver)
4. Clique em **Update the stack**

## Backup do Banco de Dados

Para fazer backup do banco de dados:

1. No Portainer, vá para **Containers**
2. Encontre o contêiner do banco de dados
3. Clique no ícone **>_** (Console)
4. Execute o comando:
   ```bash
   pg_dump -U postgres -d speedfunnels > /var/lib/postgresql/data/backup.sql
   ```
5. O arquivo de backup estará disponível no volume `db-data`

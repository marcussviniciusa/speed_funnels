# Guia de Deploy com Portainer usando YAML

Este guia descreve como fazer o deploy da aplicação Speed Funnels usando o Portainer com um arquivo YAML, assumindo que você já tem o Portainer e o Traefik instalados.

## Pré-requisitos

- Portainer já instalado e acessível
- Traefik já instalado e configurado como proxy reverso
- Rede `traefik-public` já criada
- Um domínio configurado para apontar para o IP do seu servidor

## Passo a Passo para Deploy

### 1. Preparar o Arquivo .env

Certifique-se de que seu arquivo `.env` contém todas as variáveis necessárias:

```
# Database
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
DB_NAME=speedfunnels

# Meta Ads Integration
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_REDIRECT_URI=https://seu-dominio.com/api/integrations/meta/callback

# Google Analytics Integration
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=https://seu-dominio.com/api/integrations/google/callback

# Security
JWT_SECRET=sua_chave_jwt_secreta

# Traefik Configuration
DOMAIN_NAME=seu-dominio.com
```

### 2. Construir a Imagem Docker (Opcional)

Se você quiser construir a imagem localmente antes de fazer o deploy:

```bash
docker build -t speed-funnels:latest .
```

### 3. Fazer Login no Portainer

1. Acesse a interface web do Portainer (geralmente em `http://seu-servidor:9000` ou `https://portainer.seu-dominio.com`)
2. Faça login com suas credenciais

### 4. Criar um Novo Stack

1. No menu lateral, clique em **Stacks**
2. Clique no botão **Add stack**
3. Dê um nome ao stack, por exemplo: `speed-funnels`

### 5. Configurar o Stack

Existem duas maneiras de configurar o stack:

#### Opção A: Upload do Arquivo YAML

1. Na seção **Build method**, selecione **Upload**
2. Clique em **Select file** e selecione o arquivo `portainer-stack.yml`

#### Opção B: Editor Web

1. Na seção **Build method**, selecione **Web editor**
2. Cole o conteúdo do arquivo `portainer-stack.yml` no editor

### 6. Configurar Variáveis de Ambiente

1. Role para baixo até a seção **Environment variables**
2. Adicione cada variável do seu arquivo `.env` como uma variável de ambiente
3. Certifique-se de incluir pelo menos:
   - `DOMAIN_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_REDIRECT_URI`
   - `JWT_SECRET`

### 7. Deploy do Stack

1. Verifique todas as configurações
2. Clique no botão **Deploy the stack**
3. Aguarde enquanto o Portainer cria os contêineres

### 8. Verificar o Deploy

1. Após o deploy, você verá o stack na lista de stacks
2. Clique no nome do stack para ver os detalhes
3. Verifique se todos os contêineres estão em execução (status "Running")

### 9. Acessar a Aplicação

Acesse sua aplicação em `https://seu-dominio.com`

## Atualização da Aplicação

Para atualizar a aplicação:

1. Faça as alterações necessárias no código
2. Construa uma nova imagem Docker (se aplicável)
3. No Portainer, vá até o stack `speed-funnels`
4. Clique em **Editor**
5. Faça as alterações necessárias no arquivo YAML (se houver)
6. Clique em **Update the stack**

## Solução de Problemas

### Problema: Contêineres não iniciam

Verifique:
1. Os logs dos contêineres no Portainer
2. Se a rede `traefik-public` existe e está configurada corretamente
3. Se todas as variáveis de ambiente estão configuradas corretamente

### Problema: Aplicação não está acessível

Verifique:
1. Se o Traefik está roteando corretamente para a aplicação
2. Se o domínio está apontando para o IP correto
3. Os logs do Traefik para ver se há erros de roteamento

### Problema: Certificado SSL não está funcionando

Verifique:
1. Se o Traefik está configurado corretamente para usar o Let's Encrypt
2. Se o domínio está apontando para o IP correto
3. Se as portas 80 e 443 estão abertas no firewall

## Comandos Úteis

Para verificar os logs da aplicação:
```bash
docker logs $(docker ps -q --filter name=speed-funnels_app)
```

Para verificar os logs do banco de dados:
```bash
docker logs $(docker ps -q --filter name=speed-funnels_db)
```

Para verificar as rotas do Traefik:
```bash
docker exec $(docker ps -q --filter name=traefik) traefik status routers
```

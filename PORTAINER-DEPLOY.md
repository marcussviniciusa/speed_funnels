# Deploy no Portainer

Este documento fornece instruções passo a passo para fazer o deploy da aplicação Speed Funnels usando o Portainer.

## Preparação

Antes de iniciar o deploy, certifique-se de que:

1. Você tem acesso a um servidor com Portainer instalado
2. Você tem as credenciais de acesso ao Portainer (URL, usuário e senha)
3. Você configurou corretamente o arquivo `.env` com todas as variáveis necessárias
4. Você atualizou o arquivo `nginx.conf` com o seu domínio
5. Você atualizou o arquivo `init-letsencrypt.sh` com o seu domínio e email

## Método 1: Deploy Automatizado

### Passo 1: Configurar o ambiente

Edite os seguintes arquivos:

1. `nginx.conf`: Substitua `your-domain.com` pelo seu domínio real
2. `init-letsencrypt.sh`: 
   - Substitua `your-domain.com` pelo seu domínio real
   - Substitua `your-email@example.com` pelo seu email real

### Passo 2: Executar o script de deploy

```bash
./deploy-portainer.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>
```

Substitua:
- `<PORTAINER_URL>` pela URL do seu servidor Portainer
- `<PORTAINER_USERNAME>` pelo seu nome de usuário do Portainer
- `<PORTAINER_PASSWORD>` pela sua senha do Portainer

### Passo 3: Configurar o SSL

Após o deploy, conecte-se ao servidor via SSH e execute:

```bash
cd /caminho/para/stack/speed-funnels
./init-letsencrypt.sh
```

## Método 2: Deploy Manual

### Passo 1: Preparar os arquivos

1. Edite `nginx.conf` e substitua `your-domain.com` pelo seu domínio real
2. Edite `init-letsencrypt.sh` e substitua `your-domain.com` e `your-email@example.com` pelos valores reais

### Passo 2: Construir a imagem Docker

```bash
docker build -t speed-funnels:latest .
```

### Passo 3: Salvar a imagem como arquivo

```bash
docker save speed-funnels:latest > speed-funnels-latest.tar
```

### Passo 4: Fazer upload para o Portainer

1. Acesse o Portainer através do navegador
2. Navegue até o endpoint desejado
3. Vá para "Images" e clique em "Import"
4. Selecione o arquivo `speed-funnels-latest.tar`
5. Clique em "Upload"

### Passo 5: Criar um stack

1. Navegue até "Stacks" e clique em "Add stack"
2. Dê um nome ao stack (ex: "speed-funnels")
3. Copie o conteúdo do arquivo `docker-compose.yml` para o editor
4. Configure as variáveis de ambiente necessárias
5. Clique em "Deploy the stack"

### Passo 6: Configurar o SSL

Após o deploy, conecte-se ao servidor via SSH e execute:

```bash
cd /caminho/para/stack/speed-funnels
./init-letsencrypt.sh
```

## Verificação do Deploy

Após o deploy, você pode verificar se a aplicação está funcionando corretamente acessando:

```
https://seu-dominio.com
```

## Solução de Problemas

### Problema: Certificado SSL não está sendo emitido

Verifique:
1. Se o domínio está apontando corretamente para o servidor
2. Se as portas 80 e 443 estão abertas no firewall
3. Os logs do contêiner certbot:
   ```
   docker logs speed-funnels-certbot
   ```

### Problema: Aplicação não está acessível

Verifique:
1. Se os contêineres estão em execução:
   ```
   docker ps | grep speed-funnels
   ```
2. Os logs do contêiner nginx:
   ```
   docker logs speed-funnels-nginx
   ```
3. Os logs do contêiner da aplicação:
   ```
   docker logs speed-funnels-app
   ```

### Problema: Erro de conexão com o banco de dados

Verifique:
1. Se o contêiner do banco de dados está em execução
2. Se as variáveis de ambiente estão configuradas corretamente
3. Os logs do contêiner do banco de dados:
   ```
   docker logs speed-funnels-db
   ```

## Manutenção

### Atualização da Aplicação

Para atualizar a aplicação:

1. Construa uma nova imagem Docker
2. Salve a imagem como arquivo
3. Faça upload para o Portainer
4. Atualize o stack existente

### Backup do Banco de Dados

Para fazer backup do banco de dados:

```bash
docker exec speed-funnels-db pg_dump -U ${DB_USER} -d ${DB_NAME} > backup.sql
```

### Restauração do Banco de Dados

Para restaurar o banco de dados a partir de um backup:

```bash
cat backup.sql | docker exec -i speed-funnels-db psql -U ${DB_USER} -d ${DB_NAME}
```

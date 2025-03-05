# Guia de Deploy com Portainer e Traefik

Este guia descreve como fazer o deploy da aplicação Speed Funnels usando o Portainer com Traefik como proxy reverso.

## O que é o Traefik?

Traefik é um proxy reverso e balanceador de carga moderno projetado para microsserviços. Ele se integra nativamente com o Docker e outros orquestradores, tornando-o ideal para ambientes de contêineres. O Traefik gerencia automaticamente o roteamento de tráfego, a terminação SSL e a descoberta de serviços.

## Pré-requisitos

- Acesso a um servidor com Portainer instalado
- Credenciais de acesso ao Portainer (URL, usuário e senha)
- Um domínio configurado para apontar para o IP do seu servidor
- Docker e Docker Compose instalados na máquina local (para build da imagem)

## Preparação do Ambiente

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e adicione as seguintes variáveis:

```
# Configurações do Traefik
DOMAIN_NAME=seu-dominio.com
ACME_EMAIL=seu-email@exemplo.com
TRAEFIK_USERNAME=admin
TRAEFIK_PASSWORD_HASH=hash_da_senha
```

Para gerar o hash da senha, execute:

```bash
./scripts/generate-traefik-password.sh
```

### 2. Verificar a Configuração do Traefik

Certifique-se de que os arquivos de configuração do Traefik estão corretos:

- `traefik.yml`: Configuração principal do Traefik
- `traefik/dynamic/dashboard.yml`: Configuração do dashboard do Traefik

## Deploy Automatizado

### 1. Executar o Script de Deploy

```bash
./deploy-portainer.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>
```

Substitua:
- `<PORTAINER_URL>` pela URL do seu servidor Portainer
- `<PORTAINER_USERNAME>` pelo seu nome de usuário do Portainer
- `<PORTAINER_PASSWORD>` pela sua senha do Portainer

### 2. Selecionar o Endpoint

O script listará os endpoints disponíveis no seu Portainer. Digite o ID do endpoint onde deseja fazer o deploy.

### 3. Verificar o Deploy

Após o deploy, você pode acessar:

- Aplicação: `https://seu-dominio.com`
- Dashboard do Traefik: `https://traefik.seu-dominio.com`

## Deploy Manual

Se preferir fazer o deploy manualmente, siga estes passos:

### 1. Preparar os Arquivos

Certifique-se de que todos os arquivos de configuração estão corretos:

- `docker-compose.yml`
- `traefik.yml`
- `traefik/dynamic/dashboard.yml`
- `.env`

### 2. Construir a Imagem Docker

```bash
docker build -t speed-funnels:latest .
```

### 3. Salvar a Imagem como Arquivo

```bash
docker save speed-funnels:latest > speed-funnels-latest.tar
```

### 4. Criar a Rede Traefik Public

No Portainer, navegue até "Networks" e crie uma nova rede:

- Nome: `traefik-public`
- Driver: `overlay` (para Swarm) ou `bridge` (para standalone)
- Opções: `attachable=true` (para Swarm)

### 5. Fazer Upload da Imagem

1. Navegue até o endpoint desejado
2. Vá para "Images"
3. Clique em "Import"
4. Selecione o arquivo `speed-funnels-latest.tar`
5. Clique em "Upload"

### 6. Criar um Stack

1. Navegue até "Stacks" e clique em "Add stack"
2. Dê um nome ao stack (ex: "speed-funnels")
3. Copie o conteúdo do arquivo `docker-compose.yml` para o editor
4. Configure as variáveis de ambiente necessárias
5. Clique em "Deploy the stack"

## Configuração de Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `DB_HOST` | Host do banco de dados | `db` |
| `DB_USER` | Usuário do banco de dados | `postgres` |
| `DB_PASSWORD` | Senha do banco de dados | `sua_senha_segura` |
| `DB_NAME` | Nome do banco de dados | `speedfunnels` |
| `META_APP_ID` | ID do aplicativo Meta | `1082403447223274` |
| `META_APP_SECRET` | Segredo do aplicativo Meta | `2f7876d06426f849a51202150b3dd55a` |
| `META_REDIRECT_URI` | URI de redirecionamento do Meta | `https://seu-dominio.com/api/integrations/meta/callback` |
| `JWT_SECRET` | Segredo para assinatura de tokens JWT | `sua_chave_secreta_jwt` |
| `DOMAIN_NAME` | Nome de domínio para a aplicação | `seu-dominio.com` |
| `ACME_EMAIL` | Email para o Let's Encrypt | `seu-email@exemplo.com` |
| `TRAEFIK_USERNAME` | Nome de usuário para o dashboard do Traefik | `admin` |
| `TRAEFIK_PASSWORD_HASH` | Hash da senha para o dashboard do Traefik | `admin:$apr1$...` |

## Solução de Problemas

### Problema: Certificado SSL não está sendo emitido

Verifique:
1. Se o domínio está apontando corretamente para o servidor
2. Se as portas 80 e 443 estão abertas no firewall
3. Os logs do contêiner Traefik:
   ```
   docker logs speed-funnels-traefik
   ```
4. Verifique se o desafio HTTP do Let's Encrypt está funcionando corretamente

### Problema: Aplicação não está acessível

Verifique:
1. Se os contêineres estão em execução:
   ```
   docker ps | grep speed-funnels
   ```
2. Os logs do contêiner Traefik:
   ```
   docker logs speed-funnels-traefik
   ```
3. Os logs do contêiner da aplicação:
   ```
   docker logs speed-funnels-app
   ```
4. Se as regras de roteamento do Traefik estão configuradas corretamente

### Problema: Dashboard do Traefik não está acessível

Verifique:
1. Se o hash da senha está configurado corretamente
2. Se o middleware de autenticação está configurado corretamente
3. Se o domínio `traefik.seu-dominio.com` está apontando para o servidor

## Manutenção

### Atualização da Aplicação

Para atualizar a aplicação:

1. Faça pull das alterações mais recentes do repositório
2. Execute o script de deploy novamente
3. O script detectará o stack existente e o atualizará

### Backup do Banco de Dados

Para fazer backup do banco de dados:

```bash
./scripts/db-backup.sh backup
```

### Restauração do Banco de Dados

Para restaurar o banco de dados a partir de um backup:

```bash
./scripts/db-backup.sh restore arquivo_de_backup.sql
```

### Monitoramento

Para monitorar os contêineres:

```bash
./scripts/monitor.sh status
```

Para ver os logs de um contêiner específico:

```bash
./scripts/monitor.sh logs speed-funnels-app
```

## Vantagens do Traefik

- **Configuração Automática**: O Traefik detecta automaticamente novos serviços e configura o roteamento
- **Let's Encrypt Integrado**: Gerenciamento automático de certificados SSL
- **Dashboard Web**: Interface gráfica para monitorar rotas, serviços e middlewares
- **Hot Reloading**: Atualiza a configuração sem reiniciar o serviço
- **Middlewares**: Suporte a vários middlewares como autenticação, rate limiting, etc.
- **Alta Performance**: Projetado para ser rápido e eficiente

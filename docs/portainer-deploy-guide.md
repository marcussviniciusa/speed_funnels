# Guia de Deploy com Portainer

Este guia descreve como fazer o deploy da aplicação Speed Funnels usando o Portainer, uma interface gráfica para gerenciamento de contêineres Docker.

## Pré-requisitos

- Acesso a um servidor com Portainer instalado
- Credenciais de acesso ao Portainer (URL, usuário e senha)
- Docker e Docker Compose instalados na máquina local (para build da imagem)
- Git instalado na máquina local

## Método 1: Deploy Automatizado (Script)

O projeto inclui um script que automatiza o processo de deploy para o Portainer.

### Passo 1: Preparar o ambiente

Certifique-se de que o arquivo `.env` está configurado corretamente com todas as variáveis de ambiente necessárias. Você pode usar o arquivo `.env.example` como referência.

### Passo 2: Executar o script de deploy

```bash
./deploy-portainer.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>
```

Substitua:
- `<PORTAINER_URL>` pela URL do seu servidor Portainer (ex: `https://portainer.seudominio.com`)
- `<PORTAINER_USERNAME>` pelo seu nome de usuário do Portainer
- `<PORTAINER_PASSWORD>` pela sua senha do Portainer

### Passo 3: Selecionar o endpoint

O script listará os endpoints disponíveis no seu Portainer. Digite o ID do endpoint onde deseja fazer o deploy.

### Passo 4: Verificar o deploy

Acesse o Portainer através do navegador para verificar se o stack foi criado/atualizado com sucesso.

## Método 2: Deploy Manual

Se preferir fazer o deploy manualmente, siga estes passos:

### Passo 1: Construir a imagem Docker

```bash
docker build -t speed-funnels:latest .
```

### Passo 2: Salvar a imagem como arquivo

```bash
docker save speed-funnels:latest > speed-funnels-latest.tar
```

### Passo 3: Acessar o Portainer

Acesse o Portainer através do navegador e faça login com suas credenciais.

### Passo 4: Fazer upload da imagem

1. Navegue até o endpoint desejado
2. Vá para "Images"
3. Clique em "Import"
4. Selecione o arquivo `speed-funnels-latest.tar`
5. Clique em "Upload"

### Passo 5: Criar um novo stack

1. Navegue até "Stacks"
2. Clique em "Add stack"
3. Dê um nome ao stack (ex: "speed-funnels")
4. Copie o conteúdo do arquivo `docker-compose.yml` para o editor
5. Configure as variáveis de ambiente necessárias
6. Clique em "Deploy the stack"

## Configuração de Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para o funcionamento correto da aplicação:

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

## Verificação do Deploy

Após o deploy, você pode verificar se a aplicação está funcionando corretamente acessando:

```
https://seu-dominio.com:3001
```

## Solução de Problemas

### Logs dos Contêineres

Para verificar os logs dos contêineres:

1. Navegue até "Containers" no Portainer
2. Clique no contêiner `speed-funnels-app`
3. Clique na aba "Logs"

### Problemas Comuns

1. **Erro de conexão com o banco de dados**
   - Verifique se as credenciais do banco de dados estão corretas
   - Verifique se o contêiner do banco de dados está em execução

2. **Erro de redirecionamento do Meta Ads**
   - Verifique se o `META_REDIRECT_URI` está configurado corretamente
   - Certifique-se de que a URL está registrada no console de desenvolvedor do Meta

3. **Erro de permissão ao salvar arquivos**
   - Verifique as permissões dos volumes Docker

## Manutenção

### Atualização da Aplicação

Para atualizar a aplicação para uma nova versão:

1. Faça pull das alterações mais recentes do repositório
2. Execute o script de deploy novamente
3. O script detectará o stack existente e o atualizará

### Backup do Banco de Dados

Para fazer backup do banco de dados:

1. Navegue até "Containers" no Portainer
2. Clique no contêiner `speed-funnels-db`
3. Clique na aba "Console"
4. Execute o comando:
   ```
   pg_dump -U ${DB_USER} -d ${DB_NAME} > /var/lib/postgresql/data/backup.sql
   ```
5. O arquivo de backup estará disponível no volume `postgres-data`

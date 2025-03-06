# Guia de Solução de Problemas

## Erro: Cannot find module 'handlebars'

Se você encontrar o seguinte erro no log do Portainer:

```
Error: Cannot find module 'handlebars'
Require stack:
- /app/src/services/emailService.js
- /app/src/controllers/schedule.controller.js
- /app/src/routes/schedule.routes.js
- /app/src/index.js
```

### Solução Automática:

Use o script de correção automática:

```bash
./scripts/fix-and-update.sh seu_usuario_dockerhub nova_tag
```

Este script irá:
1. Adicionar a dependência `handlebars` ao arquivo `package.json`
2. Reconstruir e republicar a imagem Docker
3. Fornecer instruções para atualizar o stack no Portainer

### Solução Manual:

1. Adicione a dependência `handlebars` ao arquivo `package.json`:

```json
"dependencies": {
  // outras dependências...
  "handlebars": "^4.7.8",
  // outras dependências...
}
```

2. Reconstrua e republique a imagem Docker:

```bash
./scripts/publish-dockerhub.sh seu_usuario_dockerhub nova_tag
```

3. Atualize o stack no Portainer:
   - Acesse o Portainer
   - Vá para "Stacks" e selecione seu stack
   - Atualize a variável `TAG` para a nova tag
   - Clique em "Update the stack"

## Erro: Falha na conexão com o banco de dados

Se a aplicação não conseguir se conectar ao banco de dados:

1. Verifique se as variáveis de ambiente estão configuradas corretamente:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`

2. Verifique se o banco de dados está em execução e acessível.

3. Verifique se as redes Docker estão configuradas corretamente.

## Erro: Falha na integração com Meta Ads ou Google Analytics

Se as integrações com Meta Ads ou Google Analytics não estiverem funcionando:

1. Verifique se as variáveis de ambiente estão configuradas corretamente:
   - Para Meta Ads: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
   - Para Google Analytics: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

2. Verifique se os tokens de acesso estão válidos.

3. Verifique os logs para mensagens de erro específicas.

## Erro: Certificado SSL não está sendo gerado

Se o Traefik não estiver gerando certificados SSL:

1. Verifique se as variáveis `DOMAIN_NAME` e `ACME_EMAIL` estão configuradas corretamente.

2. Verifique se o domínio está apontando para o servidor correto.

3. Verifique se a porta 443 está aberta e acessível.

## Erro: Falha no envio de emails

Se os emails não estiverem sendo enviados:

1. Verifique se as variáveis de ambiente para o serviço de email estão configuradas:
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_SECURE`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`

2. Verifique se os templates de email existem no diretório `/app/src/templates`.

3. Verifique se o serviço de email está acessível a partir do container.

## Erro: The server does not support SSL connections

Se você encontrar o seguinte erro no log do Portainer:

```
Error: The server does not support SSL connections
at Socket.<anonymous> (/app/node_modules/pg/lib/connection.js:76:37)
```

### Solução Automática:

Use o script de correção automática:

```bash
./scripts/fix-db-ssl.sh seu_usuario_dockerhub nova_tag
```

Este script irá:
1. Adicionar a variável `DB_SSL=false` ao arquivo `.env`
2. Atualizar a configuração de SSL no arquivo `database.js` para torná-la opcional
3. Reconstruir e republicar a imagem Docker
4. Fornecer instruções para atualizar o stack no Portainer

### Solução Manual:

1. Adicione a variável `DB_SSL=false` ao arquivo `.env`
2. Modifique o arquivo `src/config/database.js` para tornar o SSL opcional:

```javascript
dialectOptions: {
  ssl: process.env.DB_SSL === 'true' ? {
    require: true,
    rejectUnauthorized: false,
  } : false,
},
```

3. Reconstrua e republique a imagem Docker:

```bash
./scripts/publish-dockerhub.sh seu_usuario_dockerhub nova_tag
```

4. Atualize o stack no Portainer:
   - Adicione a variável `DB_SSL=false`
   - Atualize a variável `TAG` para a nova tag
   - Clique em "Update the stack"

## Problemas com o Frontend

### Problema: Frontend não está sendo servido corretamente

**Sintoma**: 
Apenas a API na porta 3001 está acessível, mas o frontend não está sendo servido.

**Causa**:
1. O servidor Express não está configurado para servir os arquivos estáticos do frontend
2. A configuração do Traefik está apontando para a porta 3000, mas a aplicação está rodando na porta 3001

**Solução**:
1. Modificar o arquivo `src/index.js` para servir os arquivos estáticos do frontend:
   ```javascript
   // Servir arquivos estáticos do frontend
   app.use(express.static(path.join(__dirname, '../client/build')));
   
   // Rota para servir o frontend React em qualquer outra rota
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
   });
   ```

2. Atualizar a configuração do Traefik no `portainer-stack.yml` para apontar para a porta 3001:
   ```yaml
   - traefik.http.services.speedfunnels.loadbalancer.server.port=3001
   ```

3. Reconstruir e republicar a imagem Docker:
   ```bash
   ./scripts/update-frontend-fix.sh
   ```

4. Atualizar o stack no Portainer com a nova versão da imagem

## Como verificar logs no Portainer

1. Acesse o Portainer
2. Vá para "Containers"
3. Clique no container que deseja verificar
4. Clique em "Logs"
5. Você pode filtrar os logs por:
   - Últimas linhas
   - Desde um timestamp específico
   - Por palavras-chave

## Como reiniciar um container no Portainer

1. Acesse o Portainer
2. Vá para "Containers"
3. Selecione o container que deseja reiniciar
4. Clique em "Restart"

## Como atualizar uma imagem no Portainer

1. Publique uma nova versão da imagem no Docker Hub:
   ```bash
   ./scripts/publish-dockerhub.sh seu_usuario_dockerhub nova_tag
   ```

2. Acesse o Portainer
3. Vá para "Stacks" e selecione seu stack
4. Atualize a variável `TAG` para a nova tag
5. Clique em "Update the stack"

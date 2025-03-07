# Guia de Publicação no Docker Hub e Deploy no Portainer

Este guia mostra como publicar sua imagem no Docker Hub e depois usá-la no Portainer para deploy.

## Publicação no Docker Hub

### 1. Criar uma conta no Docker Hub

Se você ainda não tem uma conta no Docker Hub:
1. Acesse [Docker Hub](https://hub.docker.com/)
2. Clique em "Sign Up" e siga as instruções

### 2. Fazer login no Docker Hub pelo terminal

```bash
docker login
```

Digite seu nome de usuário e senha quando solicitado.

### 3. Publicar a imagem usando o script

Use o script que criamos para facilitar a publicação:

```bash
./scripts/publish-dockerhub.sh seu_usuario_dockerhub [tag]
```

Exemplo:
```bash
./scripts/publish-dockerhub.sh marcussviniciusa v1.0.0
```

Se não especificar a tag, será usada "latest" por padrão.

### 4. Publicação manual (alternativa)

Se preferir fazer manualmente:

```bash
# Construir a imagem
docker build -t seu_usuario_dockerhub/speed-funnels:tag .

# Publicar a imagem
docker push seu_usuario_dockerhub/speed-funnels:tag
```

## Deploy no Portainer usando a imagem do Docker Hub

### 1. Atualizar o arquivo YAML

Você tem duas opções:

#### Opção A: Definir a variável REGISTRY_URL

No Portainer, ao criar o stack, adicione a variável de ambiente:
- Nome: `REGISTRY_URL`
- Valor: `seu_usuario_dockerhub`

#### Opção B: Editar diretamente o arquivo YAML

Edite a linha da imagem no arquivo `portainer-stack.yml`:

```yaml
image: seu_usuario_dockerhub/speed-funnels:tag
```

### 2. Fazer o deploy no Portainer

1. Acesse o Portainer
2. Vá para "Stacks" e clique em "Add stack"
3. Dê um nome ao stack (ex: "speed-funnels")
4. Em "Build method", selecione "Web editor"
5. Cole o conteúdo do arquivo `portainer-stack.yml` (original ou modificado)
6. Adicione as variáveis de ambiente necessárias
7. Clique em "Deploy the stack"

### 3. Atualizar a imagem posteriormente

Quando precisar atualizar a aplicação:

1. Faça as alterações no código
2. Publique uma nova versão da imagem:
   ```bash
   ./scripts/publish-dockerhub.sh seu_usuario_dockerhub nova_tag
   ```
3. No Portainer, atualize o stack:
   - Se estiver usando a variável `REGISTRY_URL`, atualize a variável `TAG`
   - Se editou diretamente o YAML, atualize a tag na linha da imagem
   - Clique em "Update the stack"

## Solução de Problemas de Acesso após Deploy

Se você estiver enfrentando problemas para acessar a aplicação após o deploy, siga este guia de solução de problemas:

### 1. Verificar a Acessibilidade da Aplicação

Execute o script de verificação de acessibilidade:

```bash
node scripts/check-deployment.js
```

Este script irá testar a conexão com a API e o frontend, verificar redirecionamentos e configurações de CORS.

### 2. Verificar os Logs do Contêiner

Acesse o Portainer e verifique os logs do contêiner:

1. Navegue até "Containers" no menu lateral
2. Encontre o contêiner da aplicação Speed Funnels
3. Clique no ícone de logs (ícone de lista)
4. Procure por erros relacionados ao servimento de arquivos estáticos ou conexão com o banco de dados

Alternativamente, use o comando Docker:

```bash
docker logs <container_id>
```

### 3. Verificar Configurações de Rede

Verifique se as configurações de rede estão corretas:

1. Certifique-se de que a rede `network_public` existe:
   ```bash
   docker network ls | grep network_public
   ```

2. Verifique se o contêiner está conectado à rede correta:
   ```bash
   docker network inspect network_public
   ```

### 4. Verificar Configurações do Traefik

Verifique se o Traefik está configurado corretamente:

1. Certifique-se de que `traefik.enable=true` para o serviço app
2. Verifique se o Host está configurado corretamente
3. Confirme se a porta 3001 está exposta corretamente

### 5. Verificar Caminhos no Contêiner Docker

Acesse o contêiner e execute o script de verificação de caminhos:

```bash
docker exec -it <container_id> sh
./scripts/check-docker-paths.sh
```

### 6. Aplicar Correções Automáticas

Execute o script de correção que implementa várias melhorias:

```bash
./scripts/fix-auth.sh
```

Este script irá:
1. Corrigir o servimento de arquivos estáticos no ambiente Docker
2. Verificar a configuração do Traefik para acesso externo
3. Construir uma nova imagem Docker (v1.0.7)
4. Publicar a imagem no Docker Hub

Após executar o script, atualize o stack no Portainer para usar a nova imagem.

### 7. Verificar DNS e Certificados SSL

1. Confirme se o domínio está apontando para o servidor correto:
   ```bash
   ping seu-dominio.com
   ```

2. Verifique se os certificados SSL estão válidos:
   ```bash
   curl -vI https://seu-dominio.com
   ```

### 8. Reiniciar o Stack

Se todas as verificações acima não resolverem o problema, tente reiniciar o stack:

1. Acesse o Portainer
2. Navegue até "Stacks"
3. Selecione o stack "speed-funnels"
4. Clique em "Stop stack"
5. Após parar, clique em "Start stack"

## Vantagens de usar o Docker Hub

1. **Centralização**: Suas imagens ficam armazenadas em um repositório central
2. **Versionamento**: Você pode manter diferentes versões da sua aplicação
3. **Facilidade de deploy**: Não precisa fazer upload da imagem para cada deploy
4. **Compartilhamento**: Pode compartilhar suas imagens com outras pessoas ou serviços
5. **Integração**: Funciona bem com CI/CD e outras ferramentas de automação

## Configuração de CI/CD (opcional)

Para automatizar o processo de build e publicação, você pode configurar um pipeline de CI/CD usando GitHub Actions, GitLab CI, ou outra ferramenta similar.

Exemplo básico de workflow para GitHub Actions:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
        
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
          
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/speed-funnels:latest

# Publicação no Docker Hub e Deploy no Portainer

Este guia rápido mostra como publicar sua imagem no Docker Hub e fazer o deploy no Portainer.

## 1. Publicar no Docker Hub

### Passo 1: Login no Docker Hub

```bash
docker login
```

### Passo 2: Publicar a imagem

```bash
./scripts/publish-dockerhub.sh seu_usuario_dockerhub v1.0.0
```

Este script vai:
- Construir a imagem Docker
- Taguear a imagem com seu nome de usuário
- Fazer push para o Docker Hub

## 2. Deploy no Portainer

### Passo 1: Acessar o Portainer

Acesse a interface web do Portainer e faça login.

### Passo 2: Criar um novo Stack

1. Vá para "Stacks" e clique em "Add stack"
2. Dê um nome ao stack (ex: "speed-funnels")
3. Em "Build method", selecione "Web editor"
4. Cole o conteúdo do arquivo `portainer-stack.yml`

### Passo 3: Configurar variáveis de ambiente

Adicione pelo menos estas variáveis:
- `REGISTRY_URL`: seu_usuario_dockerhub
- `TAG`: v1.0.0 (ou a tag que você usou)
- `DOMAIN_NAME`: seu-dominio.com
- `DB_USER`: postgres
- `DB_PASSWORD`: sua_senha_segura
- `DB_NAME`: speedfunnels
- `JWT_SECRET`: sua_chave_jwt_secreta

### Passo 4: Deploy

Clique em "Deploy the stack" e aguarde a criação dos contêineres.

## 3. Verificar o Deploy

Após o deploy, sua aplicação estará disponível em:
```
https://seu-dominio.com
```

## 4. Atualizar a aplicação

Para atualizar a aplicação:

1. Faça as alterações no código
2. Publique uma nova versão:
   ```bash
   ./scripts/publish-dockerhub.sh seu_usuario_dockerhub v1.0.1
   ```
3. No Portainer, atualize o stack alterando a variável `TAG` para `v1.0.1`

## Documentação Detalhada

Para instruções mais detalhadas, consulte:
- [Guia de Publicação no Docker Hub](docs/dockerhub-deploy-guide.md)
- [Guia de Deploy com YAML no Portainer](docs/portainer-yaml-deploy.md)

# Speed Funnels

Speed Funnels é uma plataforma de integração de marketing que conecta Meta Ads e Google Analytics para otimizar funis de conversão.

## Funcionalidades Principais

- Integração com Meta Ads (Facebook/Instagram)
- Integração com Google Analytics
- Análise de funis de conversão
- Relatórios personalizados
- Dashboard interativo

## Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **Frontend**: React
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT
- **Deploy**: Docker, Portainer, Traefik
- **CI/CD**: GitHub Actions

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker e Docker Compose (para deploy)

## Instalação e Configuração

### Desenvolvimento Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/marcussviniciusa/speed_funnels.git
   cd speed_funnels
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Inicie o banco de dados:
   ```bash
   docker-compose up -d db
   ```

5. Execute as migrações:
   ```bash
   npm run migrate
   ```

6. Inicie a aplicação:
   ```bash
   npm run dev
   ```

### Deploy com Docker e Traefik

Para deploy em produção, utilizamos Docker com Traefik como proxy reverso para:
- Gerenciamento automático de certificados SSL
- Roteamento de tráfego
- Load balancing

#### Opção 1: Deploy Automatizado com Portainer

1. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

2. Gere o hash da senha para o Traefik:
   ```bash
   ./scripts/generate-traefik-password.sh
   ```

3. Execute o script de deploy:
   ```bash
   ./deploy-portainer.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD>
   ```

#### Opção 2: Deploy com YAML no Portainer

Se você já tem o Portainer e o Traefik instalados:

1. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

2. Use o script de deploy com YAML:
   ```bash
   ./scripts/deploy-yaml.sh <PORTAINER_URL> <PORTAINER_USERNAME> <PORTAINER_PASSWORD> <ENDPOINT_ID>
   ```

Ou faça o deploy manualmente no Portainer usando o arquivo `portainer-stack.yml`.

Para mais detalhes, consulte o [Guia de Deploy com YAML no Portainer](PORTAINER-YAML-DEPLOY.md).

#### Opção 3: Deploy Manual

1. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

2. Construa e inicie os contêineres:
   ```bash
   docker-compose up -d
   ```

Para mais detalhes sobre o deploy, consulte os guias:
- [Guia de Deploy com Portainer e Traefik](docs/portainer-traefik-deploy-guide.md)
- [Guia de Integração com Meta Ads](README-META-INTEGRATION.md)

## Estrutura do Projeto

```
speed_funnels/
├── client/              # Frontend React
├── server/              # Backend Node.js/Express
├── scripts/             # Scripts utilitários
├── traefik/             # Configurações do Traefik
├── docs/                # Documentação
├── docker-compose.yml   # Configuração Docker Compose
├── Dockerfile           # Dockerfile para build da aplicação
└── traefik.yml          # Configuração principal do Traefik
```

## Scripts Utilitários

- `scripts/generate-traefik-password.sh`: Gera hash de senha para o Traefik
- `scripts/monitor.sh`: Monitora e gerencia contêineres
- `scripts/db-backup.sh`: Backup e restauração do banco de dados
- `scripts/test-direct-meta-integration.js`: Testa integração direta com Meta Ads
- `scripts/test-meta-metrics.js`: Testa recuperação de métricas do Meta Ads

## Integração com Meta Ads

A integração com Meta Ads pode ser feita de duas formas:
1. **Conexão Direta**: Utilizando token de acesso
2. **Fluxo OAuth**: Autenticação completa via OAuth

Para mais detalhes, consulte o [Guia de Integração com Meta Ads](README-META-INTEGRATION.md).

## Monitoramento e Manutenção

Para monitorar os contêineres:
```bash
./scripts/monitor.sh status
```

Para visualizar logs:
```bash
./scripts/monitor.sh logs speed-funnels-app
```

Para verificar o status do Traefik:
```bash
./scripts/monitor.sh traefik-status
```

## Backup e Restauração

Para fazer backup do banco de dados:
```bash
./scripts/db-backup.sh backup
```

Para restaurar o banco de dados:
```bash
./scripts/db-backup.sh restore arquivo_de_backup.sql
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

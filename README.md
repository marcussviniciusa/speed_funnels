# Speed Funnels

Speed Funnels é uma aplicação para análise e geração de relatórios de marketing digital, integrando-se com plataformas como Meta Ads e Google Analytics.

## Funcionalidades

- Dashboard de métricas de campanhas do Meta Ads
- Dashboard de métricas do Google Analytics
- Criação de relatórios personalizados
- Compartilhamento de relatórios via links públicos
- Agendamento de relatórios por e-mail

## Tecnologias Utilizadas

- Node.js
- Express.js
- Sequelize ORM
- JWT para autenticação
- APIs do Meta Ads e Google Analytics

## Configuração do Ambiente

### Pré-requisitos

- Node.js (v14+)
- npm (v6+)
- MySQL ou outro banco de dados compatível com Sequelize

### Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/speed_funnels.git
   cd speed_funnels
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`
   - Configure as credenciais do banco de dados, chave JWT e outras configurações necessárias

4. Inicie o servidor:
   ```
   npm start
   ```

## Estrutura do Projeto

```
speed_funnels/
├── src/
│   ├── config/          # Configurações da aplicação
│   ├── controllers/     # Controladores das rotas
│   ├── middlewares/     # Middlewares personalizados
│   ├── models/          # Modelos do Sequelize
│   ├── routes/          # Definição das rotas
│   ├── services/        # Serviços para lógica de negócios
│   ├── jobs/            # Jobs agendados
│   └── index.js         # Ponto de entrada da aplicação
├── database/            # Migrações e seeders
├── .env                 # Variáveis de ambiente
├── package.json
└── README.md
```

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário (requer permissão de admin)

### Usuários

- `GET /api/users/profile` - Perfil do usuário autenticado
- `PUT /api/users/profile` - Atualizar perfil do usuário

### Empresas

- `GET /api/companies` - Listar empresas
- `GET /api/companies/:id` - Detalhes de uma empresa
- `POST /api/companies` - Criar nova empresa (requer permissão de admin)
- `PUT /api/companies/:id` - Atualizar empresa
- `DELETE /api/companies/:id` - Excluir empresa (requer permissão de admin)

### Relatórios

- `GET /api/reports/list` - Listar relatórios
- `GET /api/reports/:reportId` - Detalhes de um relatório
- `POST /api/reports/create` - Criar novo relatório
- `PUT /api/reports/:reportId` - Atualizar relatório
- `DELETE /api/reports/:reportId` - Excluir relatório
- `POST /api/reports/:reportId/share` - Criar link público para compartilhamento
- `GET /api/reports/public/:publicId` - Acessar relatório público

### Dashboards

- `GET /api/reports/meta/dashboard` - Dashboard de dados do Meta Ads
- `GET /api/reports/google/dashboard` - Dashboard de dados do Google Analytics

### Integrações

- `GET /api/integrations` - Listar integrações
- `POST /api/integrations/meta/connect` - Conectar com Meta Ads
- `POST /api/integrations/google/connect` - Conectar com Google Analytics
- `DELETE /api/integrations/:id` - Remover integração

### Agendamentos

- `GET /api/schedules` - Listar agendamentos de relatórios
- `POST /api/schedules` - Criar novo agendamento
- `PUT /api/schedules/:id` - Atualizar agendamento
- `DELETE /api/schedules/:id` - Excluir agendamento

## Modo de Desenvolvimento

Para facilitar o desenvolvimento sem necessidade de um banco de dados, o projeto inclui modos de simulação:

```
npm run dev
```

No modo de desenvolvimento, a autenticação é simulada e dados mockados são usados para testes.

## Licença

ISC

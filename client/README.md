# Speed Funnels - Cliente Frontend

Este é o cliente frontend da aplicação Speed Funnels, uma plataforma para análise e geração de relatórios de marketing digital.

## Tecnologias Utilizadas

- React 18
- Material UI 5
- React Router 6
- Axios
- Chart.js
- Date-fns

## Estrutura do Projeto

```
client/
├── public/              # Arquivos públicos
├── src/                 # Código fonte
│   ├── components/      # Componentes reutilizáveis
│   │   ├── charts/      # Componentes de gráficos
│   │   ├── dashboard/   # Componentes do dashboard
│   │   ├── filters/     # Componentes de filtros
│   │   ├── layouts/     # Layouts da aplicação
│   │   └── tables/      # Componentes de tabelas
│   ├── contexts/        # Contextos React (AuthContext, etc.)
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Serviços (API, etc.)
│   ├── utils/           # Utilitários e constantes
│   ├── App.js           # Componente principal
│   └── index.js         # Ponto de entrada
└── package.json         # Dependências e scripts
```

## Funcionalidades

- **Autenticação**: Login, logout e gerenciamento de sessão
- **Dashboard**: Visualização de métricas e KPIs
- **Relatórios**: Criação, visualização e download de relatórios
- **Configurações**: Configurações de conta e integrações
- **Perfil**: Gerenciamento de perfil de usuário

## Como Executar

1. Instale as dependências:
   ```
   npm install
   ```

2. Execute o projeto em modo de desenvolvimento:
   ```
   npm start
   ```

3. Acesse a aplicação em [http://localhost:3000](http://localhost:3000)

## Integração com o Backend

O cliente se comunica com o backend através de uma API REST. A URL base da API pode ser configurada através da variável de ambiente `REACT_APP_API_URL` ou através do proxy configurado no `package.json`.

## Variáveis de Ambiente

- `REACT_APP_API_URL`: URL base da API (padrão: http://localhost:3001)
- `PORT`: Porta em que o cliente será executado (padrão: 3000)

## Scripts Disponíveis

- `npm start`: Inicia o servidor de desenvolvimento
- `npm build`: Cria uma versão otimizada para produção
- `npm test`: Executa os testes
- `npm eject`: Ejeta a configuração do Create React App

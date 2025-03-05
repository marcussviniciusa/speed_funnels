const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const companyRoutes = require('./routes/company.routes');
const reportRoutes = require('./routes/report.routes');
const integrationRoutes = require('./routes/integration.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const metricsRoutes = require('./routes/metrics.routes');
const { initCronJobs } = require('./config/cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Speed Funnels API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #2196f3;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
          }
          h2 {
            color: #0d47a1;
            margin-top: 30px;
          }
          code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
          }
          .endpoint {
            margin-bottom: 15px;
            padding: 10px;
            background: #f9f9f9;
            border-left: 4px solid #2196f3;
          }
          .method {
            font-weight: bold;
            color: #0d47a1;
          }
        </style>
      </head>
      <body>
        <h1>Speed Funnels API</h1>
        <p>Bem-vindo à API do Speed Funnels, uma plataforma para análise e geração de relatórios de marketing digital.</p>
        
        <h2>Endpoints Disponíveis</h2>
        
        <div class="endpoint">
          <p><span class="method">POST</span> <code>/api/auth/login</code> - Autenticação de usuário</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/users/me</code> - Dados do usuário autenticado</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/users/profile</code> - Perfil do usuário autenticado</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/reports/list</code> - Lista de relatórios</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/reports/:reportId</code> - Detalhes de um relatório específico</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/reports/meta/dashboard</code> - Dashboard de dados do Meta Ads</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/reports/google/dashboard</code> - Dashboard de dados do Google Analytics</p>
        </div>
        
        <p>Para mais informações, consulte a documentação completa da API.</p>
        
        <p>Versão: 1.0.0</p>
      </body>
    </html>
  `);
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/metrics', metricsRoutes);

// Tratamento de erros
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.stack);
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message,
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    if (process.env.NODE_ENV === 'development_no_db') {
      console.log('Iniciando servidor em modo de desenvolvimento sem banco de dados...');
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
    } else {
      await sequelize.authenticate();
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
      
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        
        // Inicializar cron jobs
        if (process.env.ENABLE_CRON_JOBS === 'true') {
          initCronJobs();
        }
      });
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    console.log('Tentando iniciar sem o banco de dados...');
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} (sem banco de dados)`);
    });
  }
}

startServer(); 
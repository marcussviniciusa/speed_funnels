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
const settingsRoutes = require('./routes/settings.routes');
const adDataRoutes = require('./routes/adData.routes');
const authCallbackRoutes = require('./routes/auth.callback.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const { initCronJobs } = require('./config/cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://speedfunnels.marcussviniciusa.cloud',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Servir arquivos estáticos do frontend
const clientBuildPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../client/build') 
  : path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));
console.log(`Servindo arquivos estáticos de: ${clientBuildPath}`);

// Rota raiz
app.get('/', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client/build', 'index.html')
    : path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath);
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/addata', adDataRoutes); // Rotas para dados de anúncios
app.use('/api/superadmin', superadminRoutes); // Rotas para funções de superadmin
app.use('/auth', authCallbackRoutes); // Rotas públicas para callbacks (sem autenticação)

// Rota para servir o frontend React em qualquer outra rota
app.get('*', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client/build', 'index.html')
    : path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath);
});

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

// Importar gerenciador de migrações
const { runMigrations } = require('./migrations/migrationManager');

// Inicialização do servidor
async function startServer() {
  try {
    if (process.env.NODE_ENV === 'development_no_db') {
      console.log('Iniciando servidor em modo de desenvolvimento sem banco de dados...');
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
    } else {
      // Autenticar conexão com o banco de dados
      await sequelize.authenticate();
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
      
      // Executar migrações pendentes
      if (process.env.RUN_MIGRATIONS !== 'false') {
        console.log('Verificando e aplicando migrações pendentes...');
        await runMigrations();
      }
      
      // Iniciar o servidor
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        
        // Inicializar cron jobs
        if (process.env.ENABLE_CRON_JOBS !== 'false') {
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
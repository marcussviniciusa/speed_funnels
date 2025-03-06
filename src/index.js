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

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../client/build')));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/metrics', metricsRoutes);

// Rota para servir o frontend React em qualquer outra rota
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
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
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

// Verificar se estamos em modo sem banco de dados
if (env === 'development_no_db' || !config) {
  console.log('Modo sem banco de dados ativado - usando models simulados');
  
  // Criar uma instância Sequelize simulada
  const mockSequelize = {
    define: () => ({}),
    authenticate: () => Promise.resolve(),
    sync: () => Promise.resolve()
  };
  
  // Mockando modelos básicos
  db.User = {
    findByPk: () => Promise.resolve({ id: 1, username: 'admin', role: 'admin' }),
    findOne: () => Promise.resolve({ id: 1, username: 'admin', role: 'admin' })
  };
  
  db.Company = {
    findByPk: () => Promise.resolve({ id: 1, name: 'Empresa Teste' }),
    create: (data) => Promise.resolve({ ...data, id: 1 })
  };
  
  db.UserCompany = {
    create: (data) => Promise.resolve(data)
  };
  
  db.ApiConnection = {
    findOne: () => Promise.resolve(null),
    create: (data) => Promise.resolve(data)
  };
  
  db.sequelize = mockSequelize;
  db.Sequelize = Sequelize;
} else {
  // Configuração normal do Sequelize
  let sequelize;
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}

module.exports = db;

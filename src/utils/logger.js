/**
 * Módulo de logger para a aplicação
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Garante que o diretório de logs existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração dos formatos do logger
const { combine, timestamp, printf, colorize, align } = winston.format;

// Formato personalizado para logs
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Criar instância do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    align(),
    logFormat
  ),
  transports: [
    // Logs para arquivo
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// Se não estiver em produção, adicionar logs para console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      align(),
      logFormat
    )
  }));
}

// Métodos para facilitar o uso
module.exports = {
  info: (message) => logger.info(message),
  error: (message, error) => {
    if (error) {
      logger.error(`${message} ${error.message || ''}`);
      if (error.stack) {
        logger.debug(error.stack);
      }
    } else {
      logger.error(message);
    }
  },
  warn: (message) => logger.warn(message),
  debug: (message) => logger.debug(message),
  http: (message) => logger.http(message)
};

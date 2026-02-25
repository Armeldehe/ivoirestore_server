/**
 * Logger professionnel avec Winston
 * - Logs colorés en console (développement)
 * - Fichiers de logs rotatifs (production)
 */
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// Format personnalisé pour les logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console colorée en développement
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
    }),
    // Fichier pour les erreurs
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Fichier pour tous les logs
    new transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

module.exports = logger;

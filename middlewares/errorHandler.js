/**
 * Handler centralisé des erreurs
 * Intercepte toutes les erreurs des controllers et les formate en réponse JSON
 * Les messages d'erreur sont sécurisés en production
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Logger l'erreur
  logger.error(`${err.message} - ${req.method} ${req.originalUrl}`);

  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    error.message = 'Ressource introuvable. L\'identifiant fourni est invalide.';
    return res.status(404).json({ success: false, message: error.message });
  }

  // Erreur de champ unique Mongoose (duplicat)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `La valeur du champ "${field}" existe déjà. Veuillez utiliser une autre valeur.`;
    return res.status(400).json({ success: false, message: error.message });
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join('. ');
    return res.status(400).json({ success: false, message: error.message });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token invalide.' });
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expiré. Veuillez vous reconnecter.' });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Erreur interne du serveur.'
      : error.message || 'Erreur interne du serveur.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

/**
 * Point d'entrée du serveur IvoireStore
 * Lance l'application et connecte MongoDB
 * Gère les erreurs non gérées pour la production
 */
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { port } = require('./config');

// ─── Connexion MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Démarrage du Serveur ─────────────────────────────────────────────────────
const server = app.listen(port, () => {
  logger.info(`🚀 Serveur IvoireStore démarré sur le port ${port} [${process.env.NODE_ENV}]`);
  logger.info(`📍 API disponible sur : http://localhost:${port}`);
});

// ─── Gestion des Erreurs Non Gérées ──────────────────────────────────────────

// Promesses rejetées non gérées
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`❌ Promesse rejetée non gérée : ${reason}`);
  logger.error('Arrêt du serveur...');
  server.close(() => {
    process.exit(1);
  });
});

// Exceptions non gérées
process.on('uncaughtException', (error) => {
  logger.error(`❌ Exception non gérée : ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

// Arrêt propre (SIGTERM pour Render/Railway/Docker)
process.on('SIGTERM', () => {
  logger.info('🔴 Signal SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    logger.info('✅ Serveur arrêté proprement.');
    process.exit(0);
  });
});

module.exports = server;

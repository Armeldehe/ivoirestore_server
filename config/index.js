/**
 * Configuration centrale des variables d'environnement
 * Toutes les configs sont centralisées ici pour faciliter la maintenance
 */
module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
};

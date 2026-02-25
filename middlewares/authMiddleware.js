/**
 * Middleware d'authentification JWT
 * Protège les routes qui nécessitent une connexion admin
 * Vérifie le token Bearer dans le header Authorization
 */
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const logger = require("../utils/logger");

const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est dans le header Authorization (format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Accès refusé. Vous devez être connecté pour accéder à cette ressource.",
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attacher l'admin à la requête
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Token invalide. L'utilisateur n'existe plus.",
      });
    }

    next();
  } catch (error) {
    logger.error(`Erreur d'authentification : ${error.message}`);
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré.",
    });
  }
};

/**
 * Middleware optionnel : attache req.admin si un token est présent
 * Ne renvoie pas d'erreur si le token est manquant ou invalide
 */
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    // On ignore l'erreur pour la protection optionnelle
    next();
  }
};

module.exports = { protect, optionalProtect };

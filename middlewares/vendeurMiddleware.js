/**
 * Middleware d'authentification Vendeur
 * Vérifie le token JWT vendeur et attache req.vendeur + req.boutiqueId
 */
const jwt = require("jsonwebtoken");
const Vendeur = require("../models/Vendeur");
const logger = require("../utils/logger");

const protectVendeur = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Accès refusé. Vous devez être connecté en tant que vendeur.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que c'est un token vendeur
    if (decoded.type !== "vendeur") {
      return res.status(401).json({
        success: false,
        message: "Token invalide. Utilisez un compte vendeur.",
      });
    }

    const vendeur = await Vendeur.findById(decoded.id).select("-password");

    if (!vendeur) {
      return res.status(401).json({
        success: false,
        message: "Token invalide. Le vendeur n'existe plus.",
      });
    }

    if (!vendeur.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Votre compte vendeur a été désactivé. Contactez l'administrateur.",
      });
    }

    req.vendeur = vendeur;
    req.boutiqueId = vendeur.boutique;
    next();
  } catch (error) {
    logger.error(`Erreur d'authentification vendeur : ${error.message}`);
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré.",
    });
  }
};

module.exports = { protectVendeur };

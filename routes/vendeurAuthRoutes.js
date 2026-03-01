/**
 * Routes d'authentification Vendeur
 * Connexion, profil et création de compte
 */
const express = require("express");
const router = express.Router();

const {
  loginVendeur,
  getVendeurProfile,
  updateVendeurProfile,
  createVendeurAccount,
  loginValidation,
  updateProfileValidation,
  createVendeurValidation,
} = require("../controllers/vendeurAuthController");
const { protectVendeur } = require("../middlewares/vendeurMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/adminMiddleware");
const validate = require("../middlewares/validate");

// POST /api/vendeur/login - Connexion vendeur
router.post("/login", loginValidation, validate, loginVendeur);

// GET /api/vendeur/me - Profil vendeur (protégé vendeur)
router.get("/me", protectVendeur, getVendeurProfile);

// PUT /api/vendeur/profile - Mise à jour profil (protégé vendeur)
router.put(
  "/profile",
  protectVendeur,
  updateProfileValidation,
  validate,
  updateVendeurProfile,
);

// POST /api/vendeur/create - Créer compte vendeur (admin only)
router.post(
  "/create",
  protect,
  adminOnly,
  createVendeurValidation,
  validate,
  createVendeurAccount,
);

module.exports = router;

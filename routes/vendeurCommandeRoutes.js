/**
 * Routes des Commandes Vendeur
 * Voir et gérer les commandes transmises à sa boutique
 */
const express = require("express");
const router = express.Router();

const {
  getVendeurCommandes,
  markDelivered,
  cancelVendeurCommande,
  getVendeurCommissionStats,
} = require("../controllers/commandeController");
const { protectVendeur } = require("../middlewares/vendeurMiddleware");

// Toutes les routes sont protégées vendeur
router.use(protectVendeur);

// GET /api/vendeur/orders - Commandes de sa boutique (transmises + livrées)
router.get("/", getVendeurCommandes);

// PUT /api/vendeur/orders/:id/delivered - Marquer comme livré
router.put("/:id/delivered", markDelivered);

// PUT /api/vendeur/orders/:id/cancel - Annuler la commande
router.put("/:id/cancel", cancelVendeurCommande);

// GET /api/vendeur/commissions - Stats commissions de sa boutique
router.get("/commissions", getVendeurCommissionStats);

module.exports = router;

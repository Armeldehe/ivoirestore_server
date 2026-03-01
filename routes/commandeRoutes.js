/**
 * Routes des Commandes
 * POST public (clients), GET et PUT nécessitent un admin
 */
const express = require("express");
const router = express.Router();

const {
  createCommande,
  getCommandes,
  updateCommandeStatus,
  transmitCommande,
  markCommissionPaid,
  getCommissionStats,
  commandeValidation,
  statusValidation,
} = require("../controllers/commandeController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

// POST /api/orders - Passer une commande (public - clients)
router.post("/", commandeValidation, validate, createCommande);

// GET /api/orders - Lister les commandes (admin)
router.get("/", protect, getCommandes);

// GET /api/orders/commissions - Stats commissions (admin)
router.get("/commissions", protect, getCommissionStats);

// PUT /api/orders/:id/status - Mettre à jour le statut (admin)
router.put(
  "/:id/status",
  protect,
  statusValidation,
  validate,
  updateCommandeStatus,
);

// PUT /api/orders/:id/transmit - Transmettre à la boutique (admin)
router.put("/:id/transmit", protect, transmitCommande);

// PUT /api/orders/:id/commission-paid - Marquer commission payée (admin)
router.put("/:id/commission-paid", protect, markCommissionPaid);

module.exports = router;

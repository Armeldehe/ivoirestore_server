/**
 * Routes des Boutiques
 * CRUD des boutiques partenaires - toutes les routes sont protégées
 */
const express = require("express");
const router = express.Router();

const {
  createBoutique,
  getBoutiques,
  getBoutique,
  updateBoutique,
  deleteBoutique,
  boutiqueValidation,
} = require("../controllers/boutiqueController");
const { protect, optionalProtect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

// GET /api/boutiques - Lister toutes les boutiques (Public)
router.get("/", optionalProtect, getBoutiques);

// GET /api/boutiques/:id - Récupérer une boutique (Public)
router.get("/:id", optionalProtect, getBoutique);

// ─── Routes Protégées (Admin) ────────────────────────────────────────────────
router.use(protect);

// POST /api/boutiques - Créer une boutique
router.post("/", boutiqueValidation, validate, createBoutique);

// PUT /api/boutiques/:id - Mettre à jour une boutique
router.put("/:id", boutiqueValidation, validate, updateBoutique);

// DELETE /api/boutiques/:id - Supprimer une boutique
router.delete("/:id", deleteBoutique);

module.exports = router;

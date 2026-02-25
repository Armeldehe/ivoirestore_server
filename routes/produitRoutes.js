/**
 * Routes des Produits
 * GET public, mutations nécessitent un admin
 */
const express = require("express");
const router = express.Router();

const {
  createProduit,
  getProduits,
  getProduit,
  updateProduit,
  deleteProduit,
  produitValidation,
} = require("../controllers/produitController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

// GET /api/products - Liste des produits (public, avec pagination + recherche)
router.get("/", getProduits);

// GET /api/products/:id - Détail d'un produit (public)
router.get("/:id", getProduit);

// POST /api/products - Créer un produit (admin)
router.post("/", protect, produitValidation, validate, createProduit);

// PUT /api/products/:id - Mettre à jour un produit (admin)
router.put("/:id", protect, updateProduit);

// DELETE /api/products/:id - Supprimer un produit (admin)
router.delete("/:id", protect, deleteProduit);

module.exports = router;

/**
 * Routes des Produits Vendeur
 * CRUD produits limité à la boutique du vendeur
 */
const express = require("express");
const router = express.Router();

const {
  createProduitVendeur,
  getProduitsByVendeur,
  updateProduitVendeur,
  deleteProduitVendeur,
  vendeurProduitValidation,
} = require("../controllers/vendeurProduitController");
const { protectVendeur } = require("../middlewares/vendeurMiddleware");
const validate = require("../middlewares/validate");

// Toutes les routes vendeur produits sont protégées
router.use(protectVendeur);

// GET /api/vendeur/products - Lister ses produits
router.get("/", getProduitsByVendeur);

// POST /api/vendeur/products - Créer un produit
router.post("/", vendeurProduitValidation, validate, createProduitVendeur);

// PUT /api/vendeur/products/:id - Modifier un produit
router.put("/:id", updateProduitVendeur);

// DELETE /api/vendeur/products/:id - Supprimer un produit
router.delete("/:id", deleteProduitVendeur);

module.exports = router;

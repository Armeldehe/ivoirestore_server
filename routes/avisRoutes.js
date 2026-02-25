/**
 * Routes des Avis
 * GET public, POST public (tout le monde peut laisser un avis)
 */
const express = require("express");
const router = express.Router();

const {
  createAvis,
  getAvis,
  avisValidation,
} = require("../controllers/avisController");
const validate = require("../middlewares/validate");

// GET /api/avis - Récupérer tous les avis (public)
router.get("/", getAvis);

// POST /api/avis - Créer un avis (public)
router.post("/", avisValidation, validate, createAvis);

module.exports = router;

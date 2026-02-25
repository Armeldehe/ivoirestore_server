/**
 * Controller des Avis
 * Gestion des avis clients IvoireStore
 */
const { body } = require("express-validator");
const Avis = require("../models/Avis");
const logger = require("../utils/logger");

// ─── Validations ──────────────────────────────────────────────────────────────

exports.avisValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom est obligatoire")
    .isLength({ max: 100 })
    .withMessage("Le nom ne peut pas dépasser 100 caractères"),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Le commentaire est obligatoire")
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne peut pas dépasser 500 caractères"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("La note doit être entre 1 et 5"),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Créer un avis
 * @route   POST /api/avis
 * @access  Public
 */
exports.createAvis = async (req, res, next) => {
  try {
    const avis = await Avis.create({
      name: req.body.name,
      text: req.body.text,
      rating: req.body.rating,
    });

    logger.info(`Nouvel avis créé par : ${avis.name} (${avis.rating}★)`);

    res.status(201).json({
      success: true,
      message: "Merci pour votre avis !",
      data: avis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer tous les avis
 * @route   GET /api/avis
 * @access  Public
 */
exports.getAvis = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Avis.countDocuments();
    const avis = await Avis.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: avis.length,
      total,
      data: avis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller des Boutiques
 * CRUD complet pour la gestion des boutiques partenaires
 */
const { body } = require("express-validator");
const Boutique = require("../models/Boutique");
const Produit = require("../models/Produit");
const logger = require("../utils/logger");

// ─── Validations ──────────────────────────────────────────────────────────────

exports.boutiqueValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom de la boutique est obligatoire"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Le numéro de téléphone est obligatoire"),
  body("address").trim().notEmpty().withMessage("L'adresse est obligatoire"),
  body("commissionRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Le taux de commission doit être entre 0 et 100"),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Créer une nouvelle boutique
 * @route   POST /api/boutiques
 * @access  Privé (Admin)
 */
exports.createBoutique = async (req, res, next) => {
  try {
    const boutique = await Boutique.create(req.body);

    logger.info(`Nouvelle boutique créée : ${boutique.name}`);

    res.status(201).json({
      success: true,
      message: "Boutique créée avec succès.",
      data: boutique,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer toutes les boutiques
 * @route   GET /api/boutiques
 * @access  Privé (Admin)
 */
exports.getBoutiques = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === "true";
    }

    const total = await Boutique.countDocuments(filter);
    const boutiques = await Boutique.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Masquer le numéro de téléphone pour les utilisateurs non-admins
    const sanitizedBoutiques = boutiques.map((b) => {
      const boutiqueObj = b.toObject();
      if (!req.admin) delete boutiqueObj.phone;
      return boutiqueObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedBoutiques.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: sanitizedBoutiques,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer une boutique par ID
 * @route   GET /api/boutiques/:id
 * @access  Public
 */
exports.getBoutique = async (req, res, next) => {
  try {
    const boutique = await Boutique.findById(req.params.id);

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: "Boutique introuvable.",
      });
    }

    const boutiqueObj = boutique.toObject();

    // Masquer le numéro de téléphone pour les utilisateurs non-admins
    if (!req.admin) delete boutiqueObj.phone;

    res.status(200).json({
      success: true,
      data: boutiqueObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour une boutique
 * @route   PUT /api/boutiques/:id
 * @access  Privé (Admin)
 */
exports.updateBoutique = async (req, res, next) => {
  try {
    const boutique = await Boutique.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Retourner le document mis à jour
      runValidators: true, // Exécuter les validateurs Mongoose
    });

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: "Boutique introuvable.",
      });
    }

    logger.info(`Boutique mise à jour : ${boutique.name}`);

    res.status(200).json({
      success: true,
      message: "Boutique mise à jour avec succès.",
      data: boutique,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une boutique
 * @route   DELETE /api/boutiques/:id
 * @access  Privé (Admin)
 */
exports.deleteBoutique = async (req, res, next) => {
  try {
    const boutique = await Boutique.findById(req.params.id);

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: "Boutique introuvable.",
      });
    }

    // Désactiver les produits liés à cette boutique
    await Produit.updateMany({ boutique: req.params.id }, { isActive: false });

    await boutique.deleteOne();

    logger.info(`Boutique supprimée : ${boutique.name}`);

    res.status(200).json({
      success: true,
      message:
        "Boutique supprimée avec succès. Les produits associés ont été désactivés.",
    });
  } catch (error) {
    next(error);
  }
};

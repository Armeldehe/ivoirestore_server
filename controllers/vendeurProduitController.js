/**
 * Controller des Produits Vendeur
 * CRUD produits limité à la boutique du vendeur connecté
 */
const { body } = require("express-validator");
const Produit = require("../models/Produit");
const logger = require("../utils/logger");

// ─── Validations ──────────────────────────────────────────────────────────────

exports.vendeurProduitValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom du produit est obligatoire"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Le prix doit être un nombre positif"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Le stock doit être un entier positif"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La description ne peut pas dépasser 1000 caractères"),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Créer un produit pour SA boutique
 * @route   POST /api/vendeur/products
 * @access  Privé (Vendeur)
 */
exports.createProduitVendeur = async (req, res, next) => {
  try {
    // Forcer la boutique à celle du vendeur connecté
    const produitData = {
      ...req.body,
      boutique: req.boutiqueId,
    };

    const produit = await Produit.create(produitData);

    logger.info(
      `Produit créé par vendeur ${req.vendeur.email} : ${produit.name}`,
    );

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès.",
      data: produit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lister les produits de SA boutique
 * @route   GET /api/vendeur/products
 * @access  Privé (Vendeur)
 */
exports.getProduitsByVendeur = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { boutique: req.boutiqueId };

    // Recherche par nom
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const total = await Produit.countDocuments(filter);
    const produits = await Produit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: produits.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: produits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un produit de SA boutique
 * @route   PUT /api/vendeur/products/:id
 * @access  Privé (Vendeur)
 */
exports.updateProduitVendeur = async (req, res, next) => {
  try {
    // Vérifier que le produit appartient à la boutique du vendeur
    const produit = await Produit.findOne({
      _id: req.params.id,
      boutique: req.boutiqueId,
    });

    if (!produit) {
      return res.status(404).json({
        success: false,
        message:
          "Produit introuvable ou vous n'avez pas les droits pour le modifier.",
      });
    }

    // Empêcher la modification du champ boutique
    delete req.body.boutique;

    const updated = await Produit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    logger.info(
      `Produit mis à jour par vendeur ${req.vendeur.email} : ${updated.name}`,
    );

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un produit de SA boutique
 * @route   DELETE /api/vendeur/products/:id
 * @access  Privé (Vendeur)
 */
exports.deleteProduitVendeur = async (req, res, next) => {
  try {
    const produit = await Produit.findOne({
      _id: req.params.id,
      boutique: req.boutiqueId,
    });

    if (!produit) {
      return res.status(404).json({
        success: false,
        message:
          "Produit introuvable ou vous n'avez pas les droits pour le supprimer.",
      });
    }

    await produit.deleteOne();

    logger.info(
      `Produit supprimé par vendeur ${req.vendeur.email} : ${produit.name}`,
    );

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

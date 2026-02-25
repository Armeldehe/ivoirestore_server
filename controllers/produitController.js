/**
 * Controller des Produits
 * CRUD complet avec pagination et recherche par mots-clés
 */
const { body } = require("express-validator");
const Produit = require("../models/Produit");
const Boutique = require("../models/Boutique");
const APIFeatures = require("../utils/apiFeatures");
const logger = require("../utils/logger");

// ─── Validations ──────────────────────────────────────────────────────────────

exports.produitValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom du produit est obligatoire"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Le prix doit être un nombre positif"),
  body("boutique")
    .notEmpty()
    .withMessage("La boutique est obligatoire")
    .isMongoId()
    .withMessage("ID de boutique invalide"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Le stock doit être un entier positif"),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Créer un nouveau produit
 * @route   POST /api/products
 * @access  Privé (Admin)
 */
exports.createProduit = async (req, res, next) => {
  try {
    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(req.body.boutique);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: "Boutique introuvable. Vérifiez l'ID de la boutique.",
      });
    }

    const produit = await Produit.create(req.body);

    logger.info(
      `Nouveau produit créé : ${produit.name} (boutique: ${boutique.name})`,
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
 * @desc    Récupérer tous les produits (avec pagination et recherche)
 * @route   GET /api/products?search=robe&page=1&limit=10
 * @access  Public
 */
exports.getProduits = async (req, res, next) => {
  try {
    // Filtre de base : produits actifs uniquement (pour les clients)
    // Les admins peuvent passer ?isActive=false pour voir tous les produits
    const baseQuery = {};
    if (req.query.isActive !== "false") {
      baseQuery.isActive = true;
    }

    // Si recherche par texte
    if (req.query.search) {
      baseQuery.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Filtrage par boutique
    if (req.query.boutique) {
      baseQuery.boutique = req.query.boutique;
    }

    // Filtrage par prix
    if (req.query.minPrice || req.query.maxPrice) {
      baseQuery.price = {};
      if (req.query.minPrice) baseQuery.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) baseQuery.price.$lte = Number(req.query.maxPrice);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Produit.countDocuments(baseQuery);
    const produits = await Produit.find(baseQuery)
      .populate("boutique", "name phone address isVerified")
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
 * @desc    Récupérer un produit par ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduit = async (req, res, next) => {
  try {
    const produit = await Produit.findById(req.params.id).populate(
      "boutique",
      "name phone address description isVerified",
    );

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    res.status(200).json({
      success: true,
      data: produit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 * @access  Privé (Admin)
 */
exports.updateProduit = async (req, res, next) => {
  try {
    const produit = await Produit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("boutique", "name");

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    logger.info(`Produit mis à jour : ${produit.name}`);

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès.",
      data: produit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un produit
 * @route   DELETE /api/products/:id
 * @access  Privé (Admin)
 */
exports.deleteProduit = async (req, res, next) => {
  try {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    await produit.deleteOne();

    logger.info(`Produit supprimé : ${produit.name}`);

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

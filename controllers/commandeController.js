/**
 * Controller des Commandes
 * Gestion du cycle de vie des commandes sur IvoireStore
 * - Paiement uniquement à la livraison
 * - Commission calculée automatiquement à la création
 */
const { body } = require("express-validator");
const Commande = require("../models/Commande");
const Produit = require("../models/Produit");
const Boutique = require("../models/Boutique");
const { calculateCommission } = require("../services/commissionService");
const logger = require("../utils/logger");

// ─── Validations ──────────────────────────────────────────────────────────────

exports.commandeValidation = [
  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Le nom du client est obligatoire"),
  body("customerPhone")
    .trim()
    .notEmpty()
    .withMessage("Le téléphone du client est obligatoire"),
  body("customerLocation")
    .trim()
    .notEmpty()
    .withMessage("La localisation du client est obligatoire"),
  body("product")
    .notEmpty()
    .withMessage("Le produit est obligatoire")
    .isMongoId()
    .withMessage("ID de produit invalide"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La quantité doit être au moins 1"),
];

exports.statusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Le statut est obligatoire")
    .isIn(["pending", "transmitted", "delivered", "commission_paid"])
    .withMessage(
      "Statut invalide. Valeurs: pending, transmitted, delivered, commission_paid",
    ),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Créer une nouvelle commande
 * @route   POST /api/orders
 * @access  Public (clients)
 * Calcule automatiquement la commission et lie la commande à la boutique
 */
exports.createCommande = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerLocation,
      product: productId,
      quantity = 1,
    } = req.body;

    // Récupérer le produit avec sa boutique
    const produit = await Produit.findById(productId).populate("boutique");

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    // Vérifier que le produit est actif
    if (!produit.isActive) {
      return res.status(400).json({
        success: false,
        message: "Ce produit n'est plus disponible.",
      });
    }

    // Vérifier le stock disponible
    if (produit.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Stock disponible : ${produit.stock}`,
      });
    }

    // Calcul automatique de la commission et du prix total
    const totalPrice = produit.price * quantity;
    const commissionAmount = calculateCommission(
      totalPrice,
      produit.boutique.commissionRate,
    );

    // Créer la commande avec statut=pending par défaut
    const commande = await Commande.create({
      customerName,
      customerPhone,
      customerLocation,
      product: productId,
      boutique: produit.boutique._id,
      quantity,
      totalPrice,
      commissionAmount,
      status: "pending",
    });

    // Déduire du stock
    await Produit.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity },
    });

    // Populer pour la réponse
    const commandePopulee = await Commande.findById(commande._id)
      .populate("product", "name price")
      .populate("boutique", "name phone");

    logger.info(
      `Nouvelle commande : ${commande._id} | Client: ${customerName} | Produit: ${produit.name} | Commission: ${commissionAmount} FCFA`,
    );

    res.status(201).json({
      success: true,
      message: "Commande passée avec succès. Paiement à la livraison.",
      data: commandePopulee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer toutes les commandes (avec pagination et filtres)
 * @route   GET /api/orders?status=pending&page=1&limit=10
 * @access  Privé (Admin)
 */
exports.getCommandes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.boutique) filter.boutique = req.query.boutique;

    const total = await Commande.countDocuments(filter);
    const commandes = await Commande.find(filter)
      .populate("product", "name price")
      .populate("boutique", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: commandes.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: commandes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour le statut d'une commande
 * @route   PUT /api/orders/:id/status
 * @access  Privé (Admin)
 */
exports.updateCommandeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    )
      .populate("product", "name price")
      .populate("boutique", "name phone");

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable.",
      });
    }

    logger.info(`Statut commande ${commande._id} mis à jour : ${status}`);

    res.status(200).json({
      success: true,
      message: `Statut de la commande mis à jour : ${status}`,
      data: commande,
    });
  } catch (error) {
    next(error);
  }
};

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

/**
 * @desc    Transmettre une commande à la boutique (Admin only)
 * @route   PUT /api/orders/:id/transmit
 * @access  Privé (Admin)
 */
exports.transmitCommande = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id);

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable.",
      });
    }

    if (commande.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Impossible de transmettre une commande avec le statut "${commande.status}". Seules les commandes "pending" peuvent être transmises.`,
      });
    }

    commande.status = "transmitted";
    await commande.save();

    const commandePopulee = await Commande.findById(commande._id)
      .populate("product", "name price")
      .populate("boutique", "name phone");

    logger.info(`Commande ${commande._id} transmise à la boutique`);

    res.status(200).json({
      success: true,
      message: "Commande transmise avec succès à la boutique.",
      data: commandePopulee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marquer une commande comme livrée (Vendeur only)
 * @route   PUT /api/vendeur/orders/:id/delivered
 * @access  Privé (Vendeur)
 */
exports.markDelivered = async (req, res, next) => {
  try {
    const commande = await Commande.findOne({
      _id: req.params.id,
      boutique: req.boutiqueId,
    });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable ou vous n'avez pas les droits.",
      });
    }

    if (commande.status !== "transmitted") {
      return res.status(400).json({
        success: false,
        message: `Impossible de marquer comme livrée. La commande doit être "transmitted", statut actuel: "${commande.status}".`,
      });
    }

    commande.status = "delivered";
    await commande.save();

    const commandePopulee = await Commande.findById(commande._id)
      .populate("product", "name price")
      .populate("boutique", "name phone");

    logger.info(
      `Commande ${commande._id} marquée livrée par vendeur (boutique: ${req.boutiqueId})`,
    );

    res.status(200).json({
      success: true,
      message: "Commande marquée comme livrée.",
      data: commandePopulee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marquer la commission comme payée (Admin only)
 * @route   PUT /api/orders/:id/commission-paid
 * @access  Privé (Admin)
 */
exports.markCommissionPaid = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id);

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable.",
      });
    }

    if (commande.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: `Impossible de marquer commission payée. La commande doit être "delivered", statut actuel: "${commande.status}".`,
      });
    }

    commande.status = "commission_paid";
    await commande.save();

    const commandePopulee = await Commande.findById(commande._id)
      .populate("product", "name price")
      .populate("boutique", "name phone");

    logger.info(`Commission payée pour commande ${commande._id}`);

    res.status(200).json({
      success: true,
      message: "Commission marquée comme payée.",
      data: commandePopulee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les commandes de la boutique du vendeur
 * @route   GET /api/vendeur/orders
 * @access  Privé (Vendeur)
 */
exports.getVendeurCommandes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      boutique: req.boutiqueId,
      status: { $in: ["transmitted", "delivered", "commission_paid"] },
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Commande.countDocuments(filter);
    const commandes = await Commande.find(filter)
      .populate("product", "name price images")
      .populate("boutique", "name")
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
 * @desc    Statistiques de commissions (Admin - toutes les boutiques)
 * @route   GET /api/orders/commissions
 * @access  Privé (Admin)
 */
exports.getCommissionStats = async (req, res, next) => {
  try {
    // Commissions par boutique
    const stats = await Commande.aggregate([
      {
        $match: {
          status: { $in: ["delivered", "commission_paid"] },
        },
      },
      {
        $group: {
          _id: "$boutique",
          totalCommission: { $sum: "$commissionAmount" },
          commissionDue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "delivered"] },
                "$commissionAmount",
                0,
              ],
            },
          },
          commissionPaid: {
            $sum: {
              $cond: [
                { $eq: ["$status", "commission_paid"] },
                "$commissionAmount",
                0,
              ],
            },
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          paidOrders: {
            $sum: { $cond: [{ $eq: ["$status", "commission_paid"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "boutiques",
          localField: "_id",
          foreignField: "_id",
          as: "boutique",
        },
      },
      { $unwind: "$boutique" },
      {
        $project: {
          boutique: { _id: 1, name: 1, commissionRate: 1 },
          totalCommission: 1,
          commissionDue: 1,
          commissionPaid: 1,
          totalOrders: 1,
          deliveredOrders: 1,
          paidOrders: 1,
        },
      },
      { $sort: { commissionDue: -1 } },
    ]);

    // Totaux globaux
    const totals = stats.reduce(
      (acc, s) => {
        acc.totalDue += s.commissionDue;
        acc.totalPaid += s.commissionPaid;
        acc.totalCommission += s.totalCommission;
        return acc;
      },
      { totalDue: 0, totalPaid: 0, totalCommission: 0 },
    );

    res.status(200).json({
      success: true,
      totals,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Statistiques de commissions de la boutique du vendeur
 * @route   GET /api/vendeur/commissions
 * @access  Privé (Vendeur)
 */
exports.getVendeurCommissionStats = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const boutiqueObjectId = new mongoose.Types.ObjectId(req.boutiqueId);

    const stats = await Commande.aggregate([
      {
        $match: {
          boutique: boutiqueObjectId,
          status: { $in: ["delivered", "commission_paid"] },
        },
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$commissionAmount" },
          commissionDue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "delivered"] },
                "$commissionAmount",
                0,
              ],
            },
          },
          commissionPaid: {
            $sum: {
              $cond: [
                { $eq: ["$status", "commission_paid"] },
                "$commissionAmount",
                0,
              ],
            },
          },
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || {
      totalCommission: 0,
      commissionDue: 0,
      commissionPaid: 0,
      totalRevenue: 0,
      totalOrders: 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

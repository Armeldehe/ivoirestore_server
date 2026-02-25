/**
 * Controller Admin Dashboard
 * Statistiques globales de la plateforme IvoireStore
 */
const Commande = require('../models/Commande');
const Produit = require('../models/Produit');
const Boutique = require('../models/Boutique');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

/**
 * @desc    Statistiques complètes du tableau de bord admin
 * @route   GET /api/admin/stats
 * @access  Privé (Admin)
 */
exports.getStats = async (req, res, next) => {
  try {
    // Requêtes parallèles pour les performances
    const [
      totalCommandes,
      totalProduits,
      totalBoutiques,
      totalAdmins,
      commandesParStatut,
      revenusCommissions,
      boutiquesVerifiees,
    ] = await Promise.all([
      // Nombre total de commandes
      Commande.countDocuments(),

      // Nombre total de produits actifs
      Produit.countDocuments({ isActive: true }),

      // Nombre total de boutiques
      Boutique.countDocuments(),

      // Nombre total d'admins
      Admin.countDocuments(),

      // Comptage des commandes par statut
      Commande.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenu total des commissions (commandes livrées et commission payée)
      Commande.aggregate([
        {
          $match: {
            status: { $in: ['delivered', 'commission_paid'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$commissionAmount' },
          },
        },
      ]),

      // Boutiques vérifiées
      Boutique.countDocuments({ isVerified: true }),
    ]);

    // Formater les commandes par statut
    const statutsMap = {
      pending: 0,
      transmitted: 0,
      delivered: 0,
      commission_paid: 0,
    };
    commandesParStatut.forEach((item) => {
      statutsMap[item._id] = item.count;
    });

    // Revenu total des commissions
    const revenuCommission = revenusCommissions.length > 0
      ? revenusCommissions[0].total
      : 0;

    logger.info(`Stats admin consultées par : ${req.admin.email}`);

    res.status(200).json({
      success: true,
      data: {
        commandes: {
          total: totalCommandes,
          parStatut: statutsMap,
        },
        revenuCommission: `${revenuCommission.toLocaleString()} FCFA`,
        revenuCommissionBrut: revenuCommission,
        produits: {
          total: totalProduits,
        },
        boutiques: {
          total: totalBoutiques,
          verifiees: boutiquesVerifiees,
          nonVerifiees: totalBoutiques - boutiquesVerifiees,
        },
        admins: {
          total: totalAdmins,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

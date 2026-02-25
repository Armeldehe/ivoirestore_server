/**
 * Service de calcul des commissions
 * La commission est calculée automatiquement lors de la création d'une commande
 * Formule : commissionAmount = prix_produit * (taux_commission_boutique / 100)
 */

/**
 * Calcule le montant de la commission pour une commande
 * @param {Number} productPrice - Prix du produit en FCFA
 * @param {Number} commissionRate - Taux de commission de la boutique (%)
 * @returns {Number} Montant de la commission en FCFA
 */
const calculateCommission = (productPrice, commissionRate) => {
  if (!productPrice || !commissionRate) return 0;
  const commission = (productPrice * commissionRate) / 100;
  return Math.round(commission); // Arrondi en FCFA
};

module.exports = { calculateCommission };

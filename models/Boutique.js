/**
 * Modèle Boutique
 * Représente une boutique partenaire sur la marketplace IvoireStore
 */
const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la boutique est obligatoire'],
      trim: true,
      maxlength: [150, 'Le nom ne peut pas dépasser 150 caractères'],
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'L\'adresse est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    },
    banner: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // La boutique doit être vérifiée par un admin
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% de commission par défaut
      min: [0, 'Le taux de commission ne peut pas être négatif'],
      max: [100, 'Le taux de commission ne peut pas dépasser 100%'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Boutique', boutiqueSchema);

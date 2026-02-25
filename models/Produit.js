/**
 * Modèle Produit
 * Représente un produit vendu par une boutique sur IvoireStore
 */
const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est obligatoire'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères'],
    },
    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères'],
    },
    images: {
      type: [String], // Tableau d'URLs des images
      default: [],
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
      required: [true, 'La boutique est obligatoire'],
    },
    stock: {
      type: Number,
      required: [true, 'Le stock est obligatoire'],
      min: [0, 'Le stock ne peut pas être négatif'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true, // Le produit est actif par défaut
    },
  },
  {
    timestamps: true,
  }
);

// Index de texte pour la recherche par mots-clés
produitSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Produit', produitSchema);

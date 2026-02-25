/**
 * Modèle Commande
 * Représente une commande passée par un client sur IvoireStore
 * Le paiement se fait uniquement à la livraison
 * La commission est calculée automatiquement
 */
const mongoose = require("mongoose");

const commandeSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Le nom du client est obligatoire"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    customerPhone: {
      type: String,
      required: [true, "Le téléphone du client est obligatoire"],
      trim: true,
    },
    customerLocation: {
      type: String,
      required: [true, "La localisation du client est obligatoire"],
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produit",
      required: [true, "Le produit est obligatoire"],
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: [true, "La boutique est obligatoire"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "transmitted", "delivered", "commission_paid"],
        message:
          "Statut invalide. Valeurs acceptées: pending, transmitted, delivered, commission_paid",
      },
      default: "pending",
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: [0, "Le montant de la commission ne peut pas être négatif"],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "La quantité doit être au moins 1"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Le prix total est obligatoire"],
      min: [0, "Le prix total ne peut pas être négatif"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Commande", commandeSchema);

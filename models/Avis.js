/**
 * Modèle Avis
 * Représente un avis client sur IvoireStore
 */
const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    text: {
      type: String,
      required: [true, "Le commentaire est obligatoire"],
      trim: true,
      maxlength: [500, "Le commentaire ne peut pas dépasser 500 caractères"],
    },
    rating: {
      type: Number,
      required: [true, "La note est obligatoire"],
      min: [1, "La note minimale est 1"],
      max: [5, "La note maximale est 5"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Avis", avisSchema);

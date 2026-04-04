/**
 * Modèle Vendeur
 * Représente un vendeur/partenaire sur IvoireStore
 * Chaque vendeur est lié à une seule boutique
 * Le mot de passe est automatiquement hashé avant sauvegarde
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const vendeurSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Veuillez entrer un email valide",
      ],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false,
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: [true, "La boutique est obligatoire"],
      unique: true, // 1 vendeur = 1 boutique
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false, // Email doit être vérifié
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Middleware pre-save : hashe le mot de passe avant sauvegarde
 */
vendeurSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Méthode d'instance : vérifie le mot de passe
 */
vendeurSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Vendeur", vendeurSchema);

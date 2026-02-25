/**
 * Modèle Admin
 * Gère les administrateurs de la plateforme IvoireStore
 * Le mot de passe est automatiquement hashé avant sauvegarde
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, 'L\'email est obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez entrer un email valide',
      ],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false, // Ne pas retourner le mot de passe dans les requêtes
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatiques
  }
);

/**
 * Middleware pre-save : hashe le mot de passe avant sauvegarde
 */
adminSchema.pre('save', async function () {
  // Hasher uniquement si le mot de passe a été modifié
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Méthode d'instance : vérifie le mot de passe
 * @param {String} candidatePassword - Mot de passe fourni par l'utilisateur
 * @returns {Boolean} true si le mot de passe correspond
 */
adminSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

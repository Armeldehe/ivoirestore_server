/**
 * Script de maintenance pour mettre à jour les identifiants admin
 * Usage: node scripts/updateAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const NEW_EMAIL = "armeldehe@ivoirestore.com";
const NEW_PASSWORD = "Armel40561457";

async function updateAdmin() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté.");

    // On cherche l'admin actuel (on suppose qu'il n'y en a qu'un pour l'instant ou on cible l'ancien)
    // Sinon on peut chercher par l'ancien email si on le connaît,
    // mais ici on va simplement prendre le premier admin trouvé pour simplifier
    const admin = await Admin.findOne();

    if (!admin) {
      console.log("❌ Aucun administrateur trouvé dans la base de données.");
      process.exit(1);
    }

    console.log(`📝 Mise à jour de l'admin : ${admin.email} -> ${NEW_EMAIL}`);

    admin.email = NEW_EMAIL;
    admin.password = NEW_PASSWORD; // Sera hashé par le middleware pre-save de Admin.js

    await admin.save();

    console.log("🚀 Informations mises à jour avec succès !");
    console.log(`📧 Nouvel email : ${NEW_EMAIL}`);
    console.log("🔑 Nouveau mot de passe appliqué.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour :", error);
    process.exit(1);
  }
}

updateAdmin();

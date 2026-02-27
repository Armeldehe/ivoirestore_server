/**
 * Script de nettoyage de la base de données pour la production
 * Supprime toutes les données de test tout en préservant le(s) compte(s) admin.
 *
 * Usage: node scripts/cleanDatabase.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

// Import des modèles
const Produit = require("../models/Produit");
const Boutique = require("../models/Boutique");
const Commande = require("../models/Commande");
const Avis = require("../models/Avis");

async function cleanDatabase() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à la base de données.\n");

    // ---------- Suppression des collections ----------

    const produits = await Produit.deleteMany({});
    console.log(`🗑️  Produits supprimés : ${produits.deletedCount}`);

    const commandes = await Commande.deleteMany({});
    console.log(`🗑️  Commandes supprimées : ${commandes.deletedCount}`);

    const avis = await Avis.deleteMany({});
    console.log(`🗑️  Avis supprimés : ${avis.deletedCount}`);

    const boutiques = await Boutique.deleteMany({});
    console.log(`🗑️  Boutiques supprimées : ${boutiques.deletedCount}`);

    // ---------- Résumé ----------

    console.log("\n══════════════════════════════════════");
    console.log("✅ Nettoyage terminé avec succès !");
    console.log("══════════════════════════════════════");
    console.log("🔒 Compte(s) admin préservé(s).");
    console.log("📦 La base est prête pour la production.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage :", error.message);
    process.exit(1);
  }
}

cleanDatabase();

/**
 * Script unique pour générer les slugs des boutiques existantes
 * Usage: node scripts/generateSlugs.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Boutique = require("../models/Boutique");

function makeSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const boutiques = await Boutique.find({});
  console.log("Total boutiques:", boutiques.length);

  for (const b of boutiques) {
    if (!b.slug) {
      const slug = makeSlug(b.name);
      await Boutique.updateOne({ _id: b._id }, { $set: { slug } });
      console.log("  OK:", b.name, "->", slug);
    } else {
      console.log("  SKIP:", b.name, "->", b.slug);
    }
  }

  console.log("Done!");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

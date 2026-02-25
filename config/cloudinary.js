/**
 * Configuration Cloudinary
 * Stockage d'images pour produits et boutiques IvoireStore
 */
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Vérification des variables d'environnement
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error(
    "⚠️  CLOUDINARY : Variables d'environnement manquantes !\n" +
      "   Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env",
  );
}

// Configuration SDK Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage pour les images produit
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ivoirestore/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto:good" },
    ],
  },
});

// Storage pour les images boutique (bannière)
const boutiqueStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ivoirestore/boutiques",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1200, height: 600, crop: "limit", quality: "auto:good" },
    ],
  },
});

module.exports = { cloudinary, productStorage, boutiqueStorage };

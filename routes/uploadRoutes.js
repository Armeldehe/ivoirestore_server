/**
 * Routes Upload
 * Upload d'images vers Cloudinary pour produits et boutiques
 */
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  uploadProductImage,
  uploadBoutiqueImage,
} = require("../middlewares/upload");

// Toutes les routes nécessitent l'authentification admin
router.use(protect);

/**
 * @desc    Upload image produit
 * @route   POST /api/upload/product-image
 * @access  Privé (Admin)
 */
router.post("/product-image", uploadProductImage, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucune image fournie.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Image uploadée avec succès.",
    url: req.file.path, // URL Cloudinary
  });
});

/**
 * @desc    Upload image boutique (bannière)
 * @route   POST /api/upload/boutique-image
 * @access  Privé (Admin)
 */
router.post("/boutique-image", uploadBoutiqueImage, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucune image fournie.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Image uploadée avec succès.",
    url: req.file.path, // URL Cloudinary
  });
});

module.exports = router;

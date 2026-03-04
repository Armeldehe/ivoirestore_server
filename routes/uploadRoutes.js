/**
 * Routes Upload
 * Upload d'images vers Cloudinary pour produits et boutiques
 */
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { protectVendeur } = require("../middlewares/vendeurMiddleware");
const jwt = require("jsonwebtoken");
const {
  uploadProductImage,
  uploadBoutiqueImage,
  uploadProductVideo,
} = require("../middlewares/upload");

const protectAdminOrVendeur = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Accès refusé. Token manquant.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === "vendeur") {
      return protectVendeur(req, res, next);
    } else {
      return protect(req, res, next);
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré.",
    });
  }
};

router.use(protectAdminOrVendeur);

/**
 * @desc    Upload image produit
 * @route   POST /api/upload/product-image
 * @access  Privé (Admin/Vendeur)
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
 * @desc    Upload vidéo produit (1 min max, 50MB max)
 * @route   POST /api/upload/product-video
 * @access  Privé (Admin/Vendeur)
 */
router.post("/product-video", uploadProductVideo, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucune vidéo fournie.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Vidéo uploadée avec succès.",
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

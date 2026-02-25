/**
 * Middleware Upload — Multer + Cloudinary
 * Validation type de fichier + limite de taille (5MB)
 */
const multer = require("multer");
const { productStorage, boutiqueStorage } = require("../config/cloudinary");

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Filtre de fichier commun
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP.",
      ),
      false,
    );
  }
};

// Middleware pour upload image produit
const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("image");

// Middleware pour upload image boutique
const uploadBoutiqueImage = multer({
  storage: boutiqueStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("image");

// Wrapper pour gérer les erreurs multer proprement
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Le fichier est trop volumineux. Taille maximale : 5 MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Erreur d'upload : ${err.message}`,
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

module.exports = {
  uploadProductImage: handleUpload(uploadProductImage),
  uploadBoutiqueImage: handleUpload(uploadBoutiqueImage),
};

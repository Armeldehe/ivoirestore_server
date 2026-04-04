/**
 * Controller d'authentification Vendeur
 * Gère la connexion, le profil et la création de comptes vendeurs
 */
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body } = require("express-validator");
const Vendeur = require("../models/Vendeur");
const Boutique = require("../models/Boutique");
const logger = require("../utils/logger");
const { sendVerificationEmail, sendVerificationConfirmation } = require("../services/emailService");

/**
 * Génère un token JWT pour un vendeur
 */
const generateVendeurToken = (id) => {
  return jwt.sign({ id, type: "vendeur" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// ─── Validations ──────────────────────────────────────────────────────────────

exports.loginValidation = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est obligatoire"),
];

exports.updateProfileValidation = [
  body("currentPassword")
    .optional()
    .notEmpty()
    .withMessage(
      "Le mot de passe actuel est obligatoire pour changer le mot de passe",
    ),
  body("newPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Le nouveau mot de passe doit contenir au moins 6 caractères"),
  body("address").optional().trim(),
  body("description").optional().trim(),
  body("banner").optional().trim(),
];

exports.createVendeurValidation = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("boutique")
    .notEmpty()
    .withMessage("La boutique est obligatoire")
    .isMongoId()
    .withMessage("ID de boutique invalide"),
];

exports.registerVendeurWithBoutiqueValidation = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("boutiqueName")
    .trim()
    .notEmpty()
    .withMessage("Le nom de la boutique est obligatoire")
    .isLength({ min: 3, max: 150 })
    .withMessage("Le nom de la boutique doit contenir entre 3 et 150 caractères"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Le numéro de téléphone est obligatoire"),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("L'adresse est obligatoire"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),
  body("banner")
    .optional()
    .trim(),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Connexion vendeur
 * @route   POST /api/vendeur/login
 * @access  Public
 */
exports.loginVendeur = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const vendeur = await Vendeur.findOne({ email })
      .select("+password")
      .populate("boutique", "name banner");

    if (!vendeur) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (!vendeur.isActive) {
      return res.status(403).json({
        success: false,
        message: "Votre compte a été désactivé. Contactez l'administrateur.",
      });
    }

    const isMatch = await vendeur.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    const token = generateVendeurToken(vendeur._id);

    logger.info(
      `Vendeur connecté : ${email} (boutique: ${vendeur.boutique?.name})`,
    );

    res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      vendeur: {
        id: vendeur._id,
        email: vendeur.email,
        boutique: vendeur.boutique,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Profil du vendeur connecté
 * @route   GET /api/vendeur/me
 * @access  Privé (Vendeur)
 */
exports.getVendeurProfile = async (req, res, next) => {
  try {
    const vendeur = await Vendeur.findById(req.vendeur._id).populate(
      "boutique",
      "name phone address description banner commissionRate",
    );

    res.status(200).json({
      success: true,
      vendeur,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour le profil vendeur (mot de passe, infos boutique)
 * @route   PUT /api/vendeur/profile
 * @access  Privé (Vendeur)
 */
exports.updateVendeurProfile = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, address, description, banner } =
      req.body;

    // Changer le mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Le mot de passe actuel est obligatoire pour changer le mot de passe.",
        });
      }

      const vendeur = await Vendeur.findById(req.vendeur._id).select(
        "+password",
      );
      const isMatch = await vendeur.matchPassword(currentPassword);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Le mot de passe actuel est incorrect.",
        });
      }

      vendeur.password = newPassword;
      await vendeur.save();
    }

    // Mettre à jour les infos de la boutique
    const boutiqueUpdates = {};
    if (address !== undefined) boutiqueUpdates.address = address;
    if (description !== undefined) boutiqueUpdates.description = description;
    if (banner !== undefined) boutiqueUpdates.banner = banner;

    if (Object.keys(boutiqueUpdates).length > 0) {
      await Boutique.findByIdAndUpdate(req.boutiqueId, boutiqueUpdates, {
        runValidators: true,
      });
    }

    // Retourner le profil mis à jour
    const updatedVendeur = await Vendeur.findById(req.vendeur._id).populate(
      "boutique",
      "name phone address description banner commissionRate",
    );

    logger.info(`Profil vendeur mis à jour : ${req.vendeur.email}`);

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès.",
      vendeur: updatedVendeur,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer un compte vendeur pour une boutique (Admin only)
 * @route   POST /api/vendeur/create
 * @access  Privé (Admin)
 */
exports.createVendeurAccount = async (req, res, next) => {
  try {
    const { email, password, boutique: boutiqueId } = req.body;

    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: "Boutique introuvable.",
      });
    }

    // Vérifier qu'il n'y a pas déjà un vendeur pour cette boutique
    const existingVendeur = await Vendeur.findOne({ boutique: boutiqueId });
    if (existingVendeur) {
      return res.status(400).json({
        success: false,
        message: "Un compte vendeur existe déjà pour cette boutique.",
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const existingEmail = await Vendeur.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Un vendeur avec cet email existe déjà.",
      });
    }

    const vendeur = await Vendeur.create({
      email,
      password,
      boutique: boutiqueId,
    });

    logger.info(
      `Compte vendeur créé par admin : ${email} pour boutique ${boutique.name}`,
    );

    res.status(201).json({
      success: true,
      message: `Compte vendeur créé avec succès pour la boutique "${boutique.name}".`,
      data: {
        id: vendeur._id,
        email: vendeur.email,
        boutique: {
          id: boutique._id,
          name: boutique.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enregistrement vendeur avec création de boutique (Vendeur s'enregistre lui-même)
 * @route   POST /api/vendeur/register
 * @access  Public
 */
exports.registerVendeurWithBoutique = async (req, res, next) => {
  try {
    const {
      email,
      password,
      boutiqueName,
      phone,
      address,
      description,
      banner,
    } = req.body;

    // Vérifier que l'email n'est pas déjà utilisé
    const existingEmail = await Vendeur.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Un vendeur avec cet email existe déjà.",
      });
    }

    // Créer la boutique avec commission 1%
    const boutique = await Boutique.create({
      name: boutiqueName,
      phone,
      address,
      description: description || "",
      banner: banner || "",
      commissionRate: 1, // Commission 1% par défaut
      isVerified: false, // À vérifier par admin
    });

    // Créer le vendeur
    const vendeur = await Vendeur.create({
      email,
      password,
      boutique: boutique._id,
      emailVerified: false,
    });

    // Générer le token de vérification email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Sauvegarder le token hashé avec expiration 24h
    vendeur.emailVerificationToken = hashedToken;
    vendeur.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await vendeur.save();

    // Construire le lien de vérification
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/vendeur/verify-email?token=${verificationToken}&email=${email}`;

    // Envoyer l'email de vérification
    try {
      await sendVerificationEmail({
        email,
        boutiqueName,
        verificationLink,
      });
    } catch (emailError) {
      logger.error(
        `Erreur lors de l'envoi d'email de vérification : ${emailError.message}`,
      );
      // Ne pas échouer si l'email ne peut pas être envoyé
      // L'admin peut renvoyer l'email plus tard
    }

    logger.info(
      `Vendeur auto-enregistré : ${email} pour boutique ${boutique.name} (ID: ${boutique._id}) - En attente de vérification`,
    );

    res.status(201).json({
      success: true,
      message:
        "Boutique créée avec succès! Un email de vérification a été envoyé à votre adresse. Veuillez cliquer sur le lien de confirmation.",
      vendeur: {
        id: vendeur._id,
        email: vendeur.email,
        emailVerified: vendeur.emailVerified,
        boutique: {
          id: boutique._id,
          name: boutique.name,
          slug: boutique.slug,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vérifier l'email du vendeur via le lien de vérification
 * @route   POST /api/vendeur/verify-email
 * @access  Public
 */
exports.verifyVendeurEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token et email sont obligatoires.",
      });
    }

    // Hasher le token reçu
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Chercher le vendeur avec le token et vérifié que n'est pas expiré
    const vendeur = await Vendeur.findOne({
      email,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!vendeur) {
      return res.status(400).json({
        success: false,
        message:
          "Le lien de vérification est invalide ou a expiré. Demandez un nouvel email.",
      });
    }

    // Vérifier l'email et effacer le token
    vendeur.emailVerified = true;

    // Mettre à jour la boutique pour isVerified = true
    await Boutique.findByIdAndUpdate(vendeur.boutique, {
      isVerified: true,
    });

    vendeur.emailVerificationToken = undefined;
    vendeur.emailVerificationExpires = undefined;
    await vendeur.save();

    // Envoyer email de confirmation
    try {
      await sendVerificationConfirmation({
        email: vendeur.email,
        boutiqueName: "(Bien reçu, mais boutique pas rechargée ici)",
        dashboardLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/vendeur/login`,
      });
    } catch (emailError) {
      logger.error(
        `Erreur lors de l'envoi d'email de confirmation : ${emailError.message}`,
      );
    }

    // Générer token JWT pour login automatique
    const jwtToken = generateVendeurToken(vendeur._id);

    logger.info(
      `Email vérifié pour vendeur: ${email} - Boutique activée`,
    );

    res.status(200).json({
      success: true,
      message:
        "Votre email a été vérifié avec succès! Vous êtes maintenant connecté.",
      token: jwtToken,
      vendeur: {
        id: vendeur._id,
        email: vendeur.email,
        emailVerified: vendeur.emailVerified,
        boutique: {
          id: vendeur.boutique,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

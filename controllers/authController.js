/**
 * Controller d'authentification
 * Gère l'inscription et la connexion des administrateurs
 */
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

/**
 * Génère un token JWT pour un admin
 * @param {String} id - ID de l'admin
 * @returns {String} Token JWT signé
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ─── Validations ──────────────────────────────────────────────────────────────

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Inscription d'un nouvel administrateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si l'email est déjà utilisé
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Un administrateur avec cet email existe déjà.',
      });
    }

    // Créer le nouvel admin (le password sera hashé par le middleware pre-save)
    const admin = await Admin.create({ name, email, password, role });

    const token = generateToken(admin._id);

    logger.info(`Nouvel admin créé : ${email}`);

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Connexion d'un administrateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'admin avec son mot de passe (select: false par défaut)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    // Vérifier le mot de passe
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const token = generateToken(admin._id);

    logger.info(`Admin connecté : ${email}`);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer le profil de l'admin connecté
 * @route   GET /api/auth/me
 * @access  Privé
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

/**
 * Routes d'authentification
 * Inscription et connexion des administrateurs
 */
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

// POST /api/auth/register - Inscription
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login - Connexion
router.post('/login', loginValidation, validate, login);

// GET /api/auth/me - Profil de l'admin connecté (protégé)
router.get('/me', protect, getMe);

module.exports = router;

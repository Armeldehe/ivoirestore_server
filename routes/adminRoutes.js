/**
 * Routes Admin Dashboard
 * Statistiques et gestion avancée de la plateforme
 */
const express = require('express');
const router = express.Router();

const { getStats } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

// Toutes les routes admin nécessitent une connexion
router.use(protect);

// GET /api/admin/stats - Statistiques globales du dashboard
router.get('/stats', getStats);

module.exports = router;

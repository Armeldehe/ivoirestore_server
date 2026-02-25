/**
 * Routes des Commandes
 * POST public (clients), GET et PUT nécessitent un admin
 */
const express = require('express');
const router = express.Router();

const {
  createCommande,
  getCommandes,
  updateCommandeStatus,
  commandeValidation,
  statusValidation,
} = require('../controllers/commandeController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

// POST /api/orders - Passer une commande (public - clients)
router.post('/', commandeValidation, validate, createCommande);

// GET /api/orders - Lister les commandes (admin)
router.get('/', protect, getCommandes);

// PUT /api/orders/:id/status - Mettre à jour le statut (admin)
router.put('/:id/status', protect, statusValidation, validate, updateCommandeStatus);

module.exports = router;

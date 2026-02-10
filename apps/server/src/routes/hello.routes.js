import express from 'express';

const router = express.Router();

/**
 * @route GET /api/v1/hello
 * @description Route de test simple pour vérifier le fonctionnement du serveur
 * @access Public
 * @returns {Object} 200 - Message de succès
 * @returns {Object} 500 - Erreur serveur
 */
router.get('/hello', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'VECTRYS Night Builder fonctionne !'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

export default router;

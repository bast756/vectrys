import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/v1/hello
 * @desc Route de test Hello World
 * @access Public
 */
router.get('/hello', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'VECTRYS Night Builder fonctionne !'
  });
});

export default router;

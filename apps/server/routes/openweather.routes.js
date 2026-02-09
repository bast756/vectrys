/**
 * VECTRYS — Routes OpenWeatherMap
 *
 * Endpoints : météo actuelle, prévisions, conditions mission.
 * Préfixe : /api/weather/*
 */

import express from 'express';
import openWeatherService from '../services/openweather.service.js';

const router = express.Router();

// ============================================================================
// POST /api/weather/current
// Météo actuelle par coordonnées GPS
// ============================================================================
router.post('/current', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : lat, lng',
      });
    }

    const result = await openWeatherService.getCurrentByCoords(lat, lng);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[WEATHER] Erreur current:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur météo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// GET /api/weather/city/:city
// Météo actuelle par nom de ville
// ============================================================================
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const country = req.query.country || 'FR';

    const result = await openWeatherService.getCurrentByCity(city, country);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[WEATHER] Erreur city:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur météo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/weather/forecast
// Prévisions 5 jours par coordonnées GPS
// ============================================================================
router.post('/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : lat, lng',
      });
    }

    const result = await openWeatherService.getForecast(lat, lng);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[WEATHER] Erreur forecast:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur prévisions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/weather/mission
// Évaluer les conditions météo pour une mission terrain
// ============================================================================
router.post('/mission', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : lat, lng',
      });
    }

    const result = await openWeatherService.assessMissionConditions(lat, lng);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[WEATHER] Erreur mission assessment:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur évaluation météo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

/**
 * VECTRYS — Routes Google Maps
 *
 * Endpoints : geocoding, reverse geocoding, distance, recherche de lieux.
 * Préfixe : /api/maps/*
 */

import express from 'express';
import googleMapsService from '../services/google-maps.service.js';

const router = express.Router();

// ============================================================================
// POST /api/maps/geocode
// Convertir une adresse en coordonnées GPS
// ============================================================================
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Champ requis : address',
      });
    }

    const result = await googleMapsService.geocode(address);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[MAPS] Erreur geocode:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur de geocoding',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/maps/reverse-geocode
// Convertir des coordonnées GPS en adresse
// ============================================================================
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : lat, lng',
      });
    }

    const result = await googleMapsService.reverseGeocode(lat, lng);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[MAPS] Erreur reverse geocode:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur de reverse geocoding',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/maps/distance
// Calculer distance et durée entre deux points
// ============================================================================
router.post('/distance', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : origin, destination',
      });
    }

    const validModes = ['driving', 'walking', 'bicycling', 'transit'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: `Mode invalide. Valeurs acceptées : ${validModes.join(', ')}`,
      });
    }

    const result = await googleMapsService.getDistance(origin, destination, mode);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[MAPS] Erreur distance:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur de calcul de distance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/maps/nearby
// Rechercher des lieux à proximité (hébergements, restaurants, etc.)
// ============================================================================
router.post('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 1000, type = 'lodging' } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : lat, lng',
      });
    }

    const result = await googleMapsService.searchNearby(lat, lng, radius, type);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[MAPS] Erreur nearby:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur de recherche',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

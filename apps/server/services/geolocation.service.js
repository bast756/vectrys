/**
 * Geolocation Service
 * Fonctions pour validation GPS et geofencing
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if GPS position is within acceptable radius of target location
 * @param {object} userPosition - { lat, lng }
 * @param {object} targetPosition - { lat, lng }
 * @param {number} maxRadiusMeters - Maximum acceptable distance in meters (default: 100m)
 * @returns {object} { valid: boolean, distance: number, message: string }
 */
export function validateGeofence(userPosition, targetPosition, maxRadiusMeters = 100) {
  if (!userPosition || !userPosition.lat || !userPosition.lng) {
    return {
      valid: false,
      distance: null,
      message: 'Position GPS invalide ou manquante'
    };
  }

  if (!targetPosition || !targetPosition.lat || !targetPosition.lng) {
    return {
      valid: false,
      distance: null,
      message: 'Coordonnées de la propriété invalides'
    };
  }

  const distance = calculateDistance(
    userPosition.lat,
    userPosition.lng,
    targetPosition.lat,
    targetPosition.lng
  );

  const valid = distance <= maxRadiusMeters;

  return {
    valid,
    distance: Math.round(distance),
    message: valid
      ? `Position validée (${Math.round(distance)}m du bien)`
      : `Vous êtes trop éloigné du bien (${Math.round(distance)}m, max ${maxRadiusMeters}m)`
  };
}

/**
 * Configuration du geofencing
 */
export const GEOFENCING_CONFIG = {
  // Rayon par défaut pour validation (mètres)
  DEFAULT_RADIUS: 100,

  // Rayon stricte pour missions critiques (mètres)
  STRICT_RADIUS: 50,

  // Rayon large pour zones rurales (mètres)
  LARGE_RADIUS: 200,

  // Accuracy GPS minimum acceptable (mètres)
  MIN_GPS_ACCURACY: 50,

  // Modes de validation
  MODES: {
    STRICT: 'strict',      // 50m max
    NORMAL: 'normal',      // 100m max
    FLEXIBLE: 'flexible'   // 200m max
  }
};

/**
 * Get validation radius based on mission type and location
 * @param {string} missionType - Type de mission
 * @param {string} locationContext - 'urban', 'suburban', 'rural'
 * @returns {number} Radius in meters
 */
export function getValidationRadius(missionType, locationContext = 'urban') {
  // Missions critiques = rayon strict
  const strictMissions = ['checkout', 'deep_clean', 'inspection'];
  if (strictMissions.includes(missionType) && locationContext === 'urban') {
    return GEOFENCING_CONFIG.STRICT_RADIUS;
  }

  // Zones rurales = rayon large
  if (locationContext === 'rural') {
    return GEOFENCING_CONFIG.LARGE_RADIUS;
  }

  // Default
  return GEOFENCING_CONFIG.DEFAULT_RADIUS;
}

/**
 * Validate GPS accuracy
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {object} { valid: boolean, message: string }
 */
export function validateGPSAccuracy(accuracy) {
  if (!accuracy) {
    return {
      valid: false,
      message: 'Précision GPS non disponible'
    };
  }

  const valid = accuracy <= GEOFENCING_CONFIG.MIN_GPS_ACCURACY;

  return {
    valid,
    accuracy: Math.round(accuracy),
    message: valid
      ? `Signal GPS précis (±${Math.round(accuracy)}m)`
      : `Signal GPS imprécis (±${Math.round(accuracy)}m, requis ±${GEOFENCING_CONFIG.MIN_GPS_ACCURACY}m). Veuillez sortir en extérieur.`
  };
}

export default {
  calculateDistance,
  validateGeofence,
  validateGPSAccuracy,
  getValidationRadius,
  GEOFENCING_CONFIG
};

/**
 * VECTRYS — Service Google Maps
 *
 * Geocoding, reverse geocoding, calcul de distance,
 * et recherche de lieux via l'API Google Maps.
 *
 * Utilise l'API Google Maps Platform (nécessite GOOGLE_MAPS_API_KEY).
 * Compatible avec le module Agent de Terrain pour la géolocalisation.
 *
 * @version 1.0.0
 */

const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ GOOGLE_MAPS_API_KEY non configurée — Google Maps désactivé');
    } else {
      console.log('✅ Service Google Maps initialisé');
    }
  }

  /**
   * Vérifie que la clé API est configurée
   */
  ensureApiKey() {
    if (!this.apiKey) {
      throw Object.assign(
        new Error('GOOGLE_MAPS_API_KEY non configurée'),
        { statusCode: 503 }
      );
    }
  }

  /**
   * Geocoding — Adresse vers coordonnées GPS
   * @param {string} address - Adresse à géocoder
   * @returns {Promise<Object>} { lat, lng, formatted_address, place_id }
   */
  async geocode(address) {
    this.ensureApiKey();

    const params = new URLSearchParams({
      address,
      key: this.apiKey,
      language: 'fr',
      region: 'fr',
    });

    const response = await fetch(`${MAPS_BASE_URL}/geocode/json?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      return { found: false, message: `Aucun résultat pour "${address}"` };
    }

    const result = data.results[0];
    return {
      found: true,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      types: result.types,
    };
  }

  /**
   * Reverse Geocoding — Coordonnées GPS vers adresse
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object>}
   */
  async reverseGeocode(lat, lng) {
    this.ensureApiKey();

    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: this.apiKey,
      language: 'fr',
    });

    const response = await fetch(`${MAPS_BASE_URL}/geocode/json?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      return { found: false, message: 'Aucune adresse trouvée pour ces coordonnées' };
    }

    const result = data.results[0];
    return {
      found: true,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      components: result.address_components,
    };
  }

  /**
   * Distance Matrix — Calcul de distance et durée entre deux points
   * @param {string} origin - Adresse ou "lat,lng"
   * @param {string} destination - Adresse ou "lat,lng"
   * @param {string} mode - driving | walking | bicycling | transit
   * @returns {Promise<Object>}
   */
  async getDistance(origin, destination, mode = 'driving') {
    this.ensureApiKey();

    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode,
      key: this.apiKey,
      language: 'fr',
      units: 'metric',
    });

    const response = await fetch(`${MAPS_BASE_URL}/distancematrix/json?${params}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      return { success: false, message: `Erreur API : ${data.status}` };
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      return { success: false, message: 'Itinéraire introuvable' };
    }

    return {
      success: true,
      distance: element.distance,
      duration: element.duration,
      origin: data.origin_addresses[0],
      destination: data.destination_addresses[0],
      mode,
    };
  }

  /**
   * Place Search — Recherche de lieux à proximité
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius - Rayon en mètres (max 50000)
   * @param {string} type - Type de lieu (lodging, restaurant, etc.)
   * @returns {Promise<Object>}
   */
  async searchNearby(lat, lng, radius = 1000, type = 'lodging') {
    this.ensureApiKey();

    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: Math.min(radius, 50000).toString(),
      type,
      key: this.apiKey,
      language: 'fr',
    });

    const response = await fetch(`${MAPS_BASE_URL}/place/nearbysearch/json?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return { success: false, message: `Erreur API : ${data.status}` };
    }

    return {
      success: true,
      count: data.results.length,
      places: data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating || null,
        place_id: place.place_id,
        types: place.types,
        open_now: place.opening_hours?.open_now ?? null,
      })),
    };
  }
}

const googleMapsService = new GoogleMapsService();
export default googleMapsService;

/**
 * VECTRYS — Service OpenWeatherMap
 *
 * Météo actuelle et prévisions pour les missions terrain.
 * Utile pour adapter les plannings des agents (pluie, canicule, etc.)
 *
 * Nécessite OPENWEATHER_API_KEY.
 *
 * @version 1.0.0
 */

const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class OpenWeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ OPENWEATHER_API_KEY non configurée — OpenWeather désactivé');
    } else {
      console.log('✅ Service OpenWeather initialisé');
    }
  }

  /**
   * Vérifie que la clé API est configurée
   */
  ensureApiKey() {
    if (!this.apiKey) {
      throw Object.assign(
        new Error('OPENWEATHER_API_KEY non configurée'),
        { statusCode: 503 }
      );
    }
  }

  /**
   * Météo actuelle par coordonnées GPS
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object>}
   */
  async getCurrentByCoords(lat, lng) {
    this.ensureApiKey();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      appid: this.apiKey,
      units: 'metric',
      lang: 'fr',
    });

    const response = await fetch(`${OWM_BASE_URL}/weather?${params}`);
    const data = await response.json();

    if (data.cod !== 200) {
      return { success: false, message: data.message || 'Erreur API météo' };
    }

    return this.formatCurrentWeather(data);
  }

  /**
   * Météo actuelle par nom de ville
   * @param {string} city
   * @param {string} country - Code pays ISO (ex: "FR")
   * @returns {Promise<Object>}
   */
  async getCurrentByCity(city, country = 'FR') {
    this.ensureApiKey();

    const params = new URLSearchParams({
      q: `${city},${country}`,
      appid: this.apiKey,
      units: 'metric',
      lang: 'fr',
    });

    const response = await fetch(`${OWM_BASE_URL}/weather?${params}`);
    const data = await response.json();

    if (data.cod !== 200) {
      return { success: false, message: data.message || 'Ville introuvable' };
    }

    return this.formatCurrentWeather(data);
  }

  /**
   * Prévisions 5 jours / 3 heures
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object>}
   */
  async getForecast(lat, lng) {
    this.ensureApiKey();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      appid: this.apiKey,
      units: 'metric',
      lang: 'fr',
    });

    const response = await fetch(`${OWM_BASE_URL}/forecast?${params}`);
    const data = await response.json();

    if (data.cod !== '200') {
      return { success: false, message: data.message || 'Erreur API prévisions' };
    }

    return {
      success: true,
      city: data.city.name,
      country: data.city.country,
      count: data.list.length,
      forecast: data.list.map(entry => ({
        datetime: entry.dt_txt,
        temp: entry.main.temp,
        feels_like: entry.main.feels_like,
        humidity: entry.main.humidity,
        description: entry.weather[0].description,
        icon: entry.weather[0].icon,
        wind_speed: entry.wind.speed,
        rain_3h: entry.rain?.['3h'] || 0,
      })),
    };
  }

  /**
   * Évalue les conditions pour une mission terrain
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Object>} { suitable, conditions, alerts }
   */
  async assessMissionConditions(lat, lng) {
    const weather = await this.getCurrentByCoords(lat, lng);

    if (!weather.success) return weather;

    const alerts = [];
    let suitable = true;

    // Température extrême
    if (weather.data.temp > 35) {
      alerts.push('🌡️ Canicule — prévoir hydratation et pauses');
      suitable = false;
    } else if (weather.data.temp < 0) {
      alerts.push('❄️ Gel — routes potentiellement verglaçantes');
    }

    // Vent fort
    if (weather.data.wind_speed > 50) {
      alerts.push('💨 Vent violent — mission déconseillée en extérieur');
      suitable = false;
    } else if (weather.data.wind_speed > 30) {
      alerts.push('💨 Vent fort — prudence en extérieur');
    }

    // Pluie / orage
    const weatherId = weather.data.weather_id;
    if (weatherId >= 200 && weatherId < 300) {
      alerts.push('⛈️ Orage — mission en extérieur déconseillée');
      suitable = false;
    } else if (weatherId >= 500 && weatherId < 600) {
      alerts.push('🌧️ Pluie — prévoir équipement adapté');
    } else if (weatherId >= 600 && weatherId < 700) {
      alerts.push('🌨️ Neige — vérifier l\'accessibilité du site');
    }

    return {
      success: true,
      suitable,
      conditions: weather.data,
      alerts,
      recommendation: suitable
        ? 'Conditions favorables pour la mission'
        : 'Conditions défavorables — envisager un report',
    };
  }

  /**
   * Formate les données météo brutes
   */
  formatCurrentWeather(data) {
    return {
      success: true,
      data: {
        city: data.name,
        country: data.sys.country,
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        temp_min: data.main.temp_min,
        temp_max: data.main.temp_max,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        weather_id: data.weather[0].id,
        wind_speed: Math.round(data.wind.speed * 3.6), // m/s → km/h
        wind_direction: data.wind.deg,
        clouds: data.clouds.all,
        visibility: data.visibility,
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString(),
        coord: { lat: data.coord.lat, lng: data.coord.lon },
      },
    };
  }
}

const openWeatherService = new OpenWeatherService();
export default openWeatherService;

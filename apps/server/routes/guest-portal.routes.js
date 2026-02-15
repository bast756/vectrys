// ============================================
// VECTRYS — Guest Portal Routes
// GET/POST /api/guest-portal/*
// ============================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import QRCode from 'qrcode';
import googleMapsService from '../services/google-maps.service.js';
import stripeService from '../services/stripe.service.js';
import sendgridService from '../services/sendgrid.service.js';

const router = Router();

// ─── IN-MEMORY CACHE (Guide local) ────────────────────────
const guideCache = new Map(); // key: propertyId, value: { data, expires }
const GUIDE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// All guest-portal routes require authentication
router.use(requireAuth);

// ─── RESERVATION ────────────────────────────

/**
 * GET /api/guest-portal/reservation
 * Retourne la réservation du guest connecté avec property
 */
router.get('/reservation', async (req, res) => {
  try {
    const reservation = await prisma.reservation.findFirst({
      where: { guestId: req.guest.id, status: { not: 'CANCELLED' } },
      orderBy: { checkIn: 'desc' },
      include: {
        property: {
          select: {
            id: true, name: true, address: true, city: true, zipCode: true,
            country: true, latitude: true, longitude: true,
            checkInTime: true, checkOutTime: true, imageUrls: true,
            houseRules: true,
          },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Aucune réservation trouvée' });
    }

    return res.json({
      success: true,
      data: {
        id: reservation.id,
        code: reservation.code,
        check_in_date: reservation.checkIn,
        check_out_date: reservation.checkOut,
        guest_count: reservation.guestCount,
        status: reservation.status === 'CONFIRMED' ? 'confirmed' : reservation.status === 'CHECKED_IN' ? 'checked_in' : reservation.status.toLowerCase(),
        source: reservation.source,
        checkin_done: reservation.checkinDone,
        checkout_done: reservation.checkoutDone,
        property_id: reservation.propertyId,
        property: {
          id: reservation.property.id,
          name: reservation.property.name,
          address: reservation.property.address,
          city: reservation.property.city,
          zip_code: reservation.property.zipCode,
          country: reservation.property.country,
          latitude: reservation.property.latitude,
          longitude: reservation.property.longitude,
          check_in_time: reservation.property.checkInTime,
          check_out_time: reservation.property.checkOutTime,
          image_urls: reservation.property.imageUrls,
          house_rules: reservation.property.houseRules,
        },
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Reservation error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/reservation/:id/accept-rules
 */
router.post('/reservation/:id/accept-rules', async (req, res) => {
  try {
    await prisma.reservation.update({
      where: { id: req.params.id },
      data: { checkinDone: false },
    });
    return res.json({ success: true, message: 'Règles acceptées' });
  } catch (err) {
    console.error('[Guest Portal] Accept rules error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/reservation/:id/checkin
 */
router.post('/reservation/:id/checkin', async (req, res) => {
  try {
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { checkinDone: true, status: 'CHECKED_IN' },
    });
    return res.json({ success: true, message: 'Check-in effectué', data: reservation });
  } catch (err) {
    console.error('[Guest Portal] Checkin error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/reservation/:id/checkout
 */
router.post('/reservation/:id/checkout', async (req, res) => {
  try {
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { checkoutDone: true, status: 'CHECKED_OUT' },
    });
    return res.json({ success: true, message: 'Check-out effectué', data: reservation });
  } catch (err) {
    console.error('[Guest Portal] Checkout error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * PUT /api/guest-portal/reservation/:id/checklist
 * Sauvegarde l'état de la checklist de départ
 */
router.put('/reservation/:id/checklist', async (req, res) => {
  try {
    const { items } = req.body; // [{ id, completed }]
    const reservationId = req.params.id;

    for (const item of items) {
      await prisma.checklistCompletion.upsert({
        where: {
          reservationId_checklistItemId: {
            reservationId,
            checklistItemId: item.id,
          },
        },
        update: {
          completed: item.completed,
          completedAt: item.completed ? new Date() : null,
        },
        create: {
          reservationId,
          checklistItemId: item.id,
          completed: item.completed,
          completedAt: item.completed ? new Date() : null,
        },
      });
    }

    return res.json({ success: true, message: 'Checklist mise à jour' });
  } catch (err) {
    console.error('[Guest Portal] Checklist error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ─── PROPERTY INFO ──────────────────────────

/**
 * GET /api/guest-portal/property/:id
 */
router.get('/property/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
    });
    if (!property) return res.status(404).json({ error: 'Propriété non trouvée' });

    return res.json({ success: true, data: property });
  } catch (err) {
    console.error('[Guest Portal] Property error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/wifi
 */
router.get('/property/:id/wifi', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { wifiName: true, wifiPassword: true },
    });
    if (!property) return res.status(404).json({ error: 'Propriété non trouvée' });

    // Generate WiFi QR code (WIFI:T:WPA;S:{ssid};P:{password};;)
    let qrCode = null;
    if (property.wifiName && property.wifiPassword) {
      try {
        const wifiString = `WIFI:T:WPA;S:${property.wifiName};P:${property.wifiPassword};;`;
        qrCode = await QRCode.toDataURL(wifiString, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
      } catch (qrErr) {
        console.warn('[Guest Portal] QR code generation failed:', qrErr.message);
      }
    }

    return res.json({
      success: true,
      data: {
        ssid: property.wifiName,
        password: property.wifiPassword,
        qr_code: qrCode,
        tips: [
          'Connectez-vous au réseau Wi-Fi affiché ci-dessus',
          'Le mot de passe est sensible à la casse',
          'Si le Wi-Fi ne fonctionne pas, redémarrez le routeur (boîtier blanc dans l\'entrée)',
          'Débit : ~100 Mbps en fibre optique',
        ],
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Wifi error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/instructions
 * Instructions de départ
 */
router.get('/property/:id/instructions', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { checkOutTime: true, houseRules: true },
    });
    if (!property) return res.status(404).json({ error: 'Propriété non trouvée' });

    const checklist = await prisma.checklistItem.findMany({
      where: { propertyId: req.params.id },
      orderBy: { order: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        checkout_time: property.checkOutTime,
        instructions: [
          `Départ avant ${property.checkOutTime} s'il vous plaît`,
          'Déposez les clés dans la boîte à clés (code: 4589)',
          'Fermez bien la porte d\'entrée à double tour',
          'Les poubelles jaunes = recyclage, vertes = ordures ménagères',
        ],
        garbage_info: 'Poubelles dans la cour intérieure. Jaune = recyclage, Vert = ordures ménagères. Sortie poubelles : mardi et vendredi.',
        checklist: checklist.map(item => ({
          id: item.id,
          label: item.label,
          label_en: item.labelEn,
          order: item.order,
          required: item.required,
        })),
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Instructions error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/transport
 */
router.get('/property/:id/transport', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { address: true, city: true, zipCode: true, latitude: true, longitude: true },
    });

    const points = await prisma.transportPoint.findMany({
      where: { propertyId: req.params.id },
      orderBy: { distanceMeters: 'asc' },
    });

    // Generate booking/deep link URLs based on transport type and coordinates
    const generateBookingUrl = (point, propLat, propLng) => {
      const destLat = point.latitude;
      const destLng = point.longitude;
      const type = point.type.toUpperCase();

      if (type === 'TAXI_STAND' || type === 'TAXI') {
        // Uber deep link
        return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${propLat}&pickup[longitude]=${propLng}&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(point.name)}`;
      }
      if (type === 'METRO' || type === 'BUS' || type === 'TRAIN') {
        // CityMapper directions
        return `https://citymapper.com/directions?startcoord=${propLat},${propLng}&endcoord=${destLat},${destLng}&endname=${encodeURIComponent(point.name)}`;
      }
      // Default: Google Maps directions (walking)
      if (destLat && destLng) {
        return `https://www.google.com/maps/dir/?api=1&origin=${propLat},${propLng}&destination=${destLat},${destLng}&travelmode=walking`;
      }
      return null;
    };

    return res.json({
      success: true,
      data: {
        property_address: property ? `${property.address}, ${property.zipCode || ''} ${property.city}`.replace(/\s+/g, ' ').trim() : '',
        options: points.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type.toLowerCase(),
          from: property?.address || '',
          to: p.name,
          duration: p.walkMinutes ? `${p.walkMinutes} min à pied` : p.transitMinutes ? `${p.transitMinutes} min` : null,
          distance: p.distanceMeters < 1000 ? `${p.distanceMeters}m` : `${(p.distanceMeters / 1000).toFixed(1)}km`,
          price_range: p.type === 'METRO' ? '€2.15' : p.type === 'BUS' ? '€2.15' : p.type === 'TAXI_STAND' ? '€15-40' : null,
          notes: p.notes,
          latitude: p.latitude,
          longitude: p.longitude,
          booking_url: generateBookingUrl(p, property?.latitude, property?.longitude),
        })),
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Transport error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/guide
 * Guide local (restaurants, attractions, infos pratiques)
 */
router.get('/property/:id/guide', async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Check cache first
    const cached = guideCache.get(propertyId);
    if (cached && cached.expires > Date.now()) {
      return res.json({ success: true, data: cached.data });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { latitude: true, longitude: true, city: true, zipCode: true, address: true },
    });

    // ── Fetch host recommendations from DB ──
    const hostRecs = await prisma.hostRecommendation.findMany({
      where: { propertyId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // Map host recs into guide categories
    const RESTAURANT_CATS = ['RESTAURANT', 'CAFE', 'BAR', 'BAKERY'];
    const ATTRACTION_CATS = ['ATTRACTION', 'MUSEUM', 'PARK', 'SPORT', 'NIGHTLIFE'];
    const PRACTICAL_CATS = ['SHOP', 'SUPERMARKET', 'PHARMACY', 'OTHER'];

    const hostRestaurants = hostRecs
      .filter(r => RESTAURANT_CATS.includes(r.category))
      .map(r => ({
        name: r.name,
        address: r.address || '',
        type: r.category.charAt(0) + r.category.slice(1).toLowerCase(),
        rating: r.rating || 0,
        maps_url: r.mapsUrl || null,
        image_url: r.imageUrl || null,
        host_comment: r.description || null,
        source: 'host',
      }));

    const hostAttractions = hostRecs
      .filter(r => ATTRACTION_CATS.includes(r.category))
      .map(r => ({
        name: r.name,
        description: r.description || r.address || '',
        distance_km: null,
        maps_url: r.mapsUrl || null,
        image_url: r.imageUrl || null,
        source: 'host',
      }));

    const hostPractical = {};
    hostRecs.filter(r => PRACTICAL_CATS.includes(r.category)).forEach(r => {
      const label = r.category === 'PHARMACY' ? 'Pharmacie'
        : r.category === 'SUPERMARKET' ? 'Supermarché'
        : r.name;
      hostPractical[label] = r.description || r.address || r.name;
    });

    // Hardcoded fallback data
    const fallbackGuide = {
      restaurants: [
        { name: 'Breizh Café', address: '109 Rue Vieille du Temple', type: 'Crêperie bretonne', rating: 4.5, maps_url: null, source: 'fallback' },
        { name: 'Chez Janou', address: '2 Rue Roger Verlomme', type: 'Provençal', rating: 4.3, maps_url: null, source: 'fallback' },
        { name: 'Le Marché des Enfants Rouges', address: '39 Rue de Bretagne', type: 'Marché couvert / Food court', rating: 4.6, maps_url: null, source: 'fallback' },
        { name: 'Café Charlot', address: '38 Rue de Bretagne', type: 'Café-bistrot', rating: 4.2, maps_url: null, source: 'fallback' },
        { name: "L'As du Fallafel", address: '34 Rue des Rosiers', type: 'Falafel / Street food', rating: 4.4, maps_url: null, source: 'fallback' },
        { name: 'Sushi Shop Marais', address: '56 Rue de Turenne', type: 'Japonais', rating: 3.9, maps_url: null, source: 'fallback' },
      ],
      attractions: [
        { name: 'Musée Picasso', description: 'Collection exceptionnelle de Picasso dans un hôtel particulier du XVIIe', distance_km: 0.4, maps_url: null, source: 'fallback' },
        { name: 'Place des Vosges', description: 'Plus ancienne place de Paris, architecture royale du XVIIe siècle', distance_km: 0.6, maps_url: null, source: 'fallback' },
        { name: 'Centre Pompidou', description: 'Art moderne et contemporain, architecture High-tech iconique', distance_km: 0.8, maps_url: null, source: 'fallback' },
        { name: 'Musée Carnavalet', description: "Histoire de Paris de la Préhistoire à nos jours — gratuit !", distance_km: 0.5, maps_url: null, source: 'fallback' },
        { name: 'Archives Nationales', description: 'Documents historiques dans un magnifique hôtel particulier', distance_km: 0.3, maps_url: null, source: 'fallback' },
        { name: 'Île de la Cité & Notre-Dame', description: 'Cathédrale en reconstruction, Sainte-Chapelle à voir absolument', distance_km: 1.2, maps_url: null, source: 'fallback' },
      ],
      practical_info: {
        'Urgences': 'SAMU: 15 | Pompiers: 18 | Police: 17 | Urgences EU: 112',
        'Pharmacie de garde': "Pharmacie du Marais — 120m, ouverte 7j/7 jusqu'à 21h",
        'Supermarché': 'Franprix — 50m (7h-22h) | Monoprix — 400m (8h30-21h30)',
        'Boulangerie': 'Boulangerie Julien — 80m (6h30-20h, fermé lundi)',
        'Poste': 'La Poste Bretagne — 200m (9h-18h, sam 9h-12h)',
        'Laverie': "Speed Queen — 250m (7h-22h, machines à partir de €5)",
        'Tabac/Presse': 'Tabac du Temple — 150m',
        'Parking': 'Parking Vinci Bretagne — 100m, ~€4/h',
      },
    };

    const toMapsUrl = (name, lat, lng) =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&center=${lat},${lng}`;

    const distanceKm = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // ── Merge: host recs first (priority), then Google/fallback ──
    const deduplicateByName = (hostItems, otherItems) => {
      const hostNames = new Set(hostItems.map(h => h.name.toLowerCase()));
      const filtered = otherItems.filter(g => !hostNames.has(g.name.toLowerCase()));
      return [...hostItems, ...filtered];
    };

    // Try Google Maps Places API for dynamic data
    if (property?.latitude && property?.longitude && googleMapsService.apiKey) {
      try {
        const [restaurantsRes, attractionsRes, pharmacyRes, supermarketRes] = await Promise.all([
          googleMapsService.searchNearby(property.latitude, property.longitude, 1500, 'restaurant'),
          googleMapsService.searchNearby(property.latitude, property.longitude, 2000, 'tourist_attraction'),
          googleMapsService.searchNearby(property.latitude, property.longitude, 1000, 'pharmacy'),
          googleMapsService.searchNearby(property.latitude, property.longitude, 1000, 'supermarket'),
        ]);

        const googleRestaurants = restaurantsRes.success && restaurantsRes.places?.length > 0
          ? restaurantsRes.places.slice(0, 8).map(p => ({
              name: p.name,
              address: p.address || '',
              type: (p.types || []).filter(t => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t))[0]?.replace(/_/g, ' ') || 'Restaurant',
              rating: p.rating || 0,
              maps_url: toMapsUrl(p.name, p.lat, p.lng),
              source: 'google',
            }))
          : fallbackGuide.restaurants;

        const googleAttractions = attractionsRes.success && attractionsRes.places?.length > 0
          ? attractionsRes.places.slice(0, 8).map(p => ({
              name: p.name,
              description: p.address || '',
              distance_km: parseFloat(distanceKm(property.latitude, property.longitude, p.lat, p.lng).toFixed(1)),
              maps_url: toMapsUrl(p.name, p.lat, p.lng),
              source: 'google',
            }))
          : fallbackGuide.attractions;

        const guide = {
          restaurants: deduplicateByName(hostRestaurants, googleRestaurants).slice(0, 12),
          attractions: deduplicateByName(hostAttractions, googleAttractions).slice(0, 12),
          practical_info: { ...fallbackGuide.practical_info, ...hostPractical },
        };

        // Enrich practical_info with real pharmacy/supermarket data (only if host didn't set them)
        if (!hostPractical['Pharmacie'] && pharmacyRes.success && pharmacyRes.places?.length > 0) {
          const p = pharmacyRes.places[0];
          const dist = Math.round(distanceKm(property.latitude, property.longitude, p.lat, p.lng) * 1000);
          guide.practical_info['Pharmacie'] = `${p.name} — ${dist}m${p.open_now ? ' (ouvert)' : ''}`;
        }
        if (!hostPractical['Supermarché'] && supermarketRes.success && supermarketRes.places?.length > 0) {
          const s = supermarketRes.places[0];
          const dist = Math.round(distanceKm(property.latitude, property.longitude, s.lat, s.lng) * 1000);
          guide.practical_info['Supermarché'] = `${s.name} — ${dist}m${s.open_now ? ' (ouvert)' : ''}`;
        }

        // Cache for 24h
        guideCache.set(propertyId, { data: guide, expires: Date.now() + GUIDE_CACHE_TTL });
        return res.json({ success: true, data: guide });
      } catch (apiErr) {
        console.warn('[Guest Portal] Google Maps API error, falling back to hardcoded data:', apiErr.message);
      }
    }

    // Fallback: merge host recs with hardcoded data
    const guide = {
      restaurants: deduplicateByName(hostRestaurants, fallbackGuide.restaurants).slice(0, 12),
      attractions: deduplicateByName(hostAttractions, fallbackGuide.attractions).slice(0, 12),
      practical_info: { ...fallbackGuide.practical_info, ...hostPractical },
    };
    guideCache.set(propertyId, { data: guide, expires: Date.now() + GUIDE_CACHE_TTL });
    return res.json({ success: true, data: guide });
  } catch (err) {
    console.error('[Guest Portal] Guide error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/weather
 * Météo via OpenWeather (ou données mock en dev)
 */
router.get('/property/:id/weather', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { latitude: true, longitude: true, city: true },
    });
    if (!property) return res.status(404).json({ error: 'Propriété non trouvée' });

    // Tenter OpenWeather API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${property.latitude}&lon=${property.longitude}&units=metric&lang=fr&appid=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return res.json({
            success: true,
            data: {
              city: property.city || 'Paris',
              country: 'FR',
              current: {
                temp: Math.round(data.current.temp),
                feels_like: Math.round(data.current.feels_like),
                humidity: data.current.humidity,
                description: data.current.weather[0]?.description || '',
                icon: data.current.weather[0]?.icon || '01d',
                wind_speed: Math.round(data.current.wind_speed * 3.6),
              },
              forecast: (data.daily || []).slice(0, 7).map(d => ({
                date: new Date(d.dt * 1000).toISOString().split('T')[0],
                temp_min: Math.round(d.temp.min),
                temp_max: Math.round(d.temp.max),
                description: d.weather[0]?.description || '',
                icon: d.weather[0]?.icon || '01d',
                precipitation_probability: Math.round((d.pop || 0) * 100),
              })),
            },
          });
        }
      } catch {
        // Fallback to mock data
      }
    }

    // Mock data pour démo
    const today = new Date();
    return res.json({
      success: true,
      data: {
        city: property.city || 'Paris',
        country: 'FR',
        current: {
          temp: 8,
          feels_like: 5,
          humidity: 72,
          description: 'Partiellement nuageux',
          icon: '02d',
          wind_speed: 15,
        },
        forecast: Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const temps = [
            { min: 3, max: 8, desc: 'Partiellement nuageux', icon: '02d', precip: 20 },
            { min: 4, max: 10, desc: 'Éclaircies', icon: '02d', precip: 10 },
            { min: 2, max: 7, desc: 'Pluie légère', icon: '10d', precip: 65 },
            { min: 5, max: 12, desc: 'Ensoleillé', icon: '01d', precip: 5 },
            { min: 6, max: 13, desc: 'Ensoleillé', icon: '01d', precip: 0 },
            { min: 4, max: 9, desc: 'Couvert', icon: '04d', precip: 40 },
            { min: 3, max: 8, desc: 'Averses', icon: '09d', precip: 70 },
          ][i];
          return {
            date: date.toISOString().split('T')[0],
            temp_min: temps.min,
            temp_max: temps.max,
            description: temps.desc,
            icon: temps.icon,
            precipitation_probability: temps.precip,
          };
        }),
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Weather error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/property/:id/reviews
 */
router.get('/property/:id/reviews', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { reservation: { propertyId: req.params.id } },
      include: { guest: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: ratings });
  } catch (err) {
    console.error('[Guest Portal] Reviews error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/reservation/:id/review
 */
router.post('/reservation/:id/review', async (req, res) => {
  try {
    const { overall, cleanliness, communication, location, value, comment } = req.body;
    const rating = await prisma.rating.create({
      data: {
        reservationId: req.params.id,
        guestId: req.guest.id,
        overall: overall || 5,
        cleanliness, communication, location, value,
        comment,
      },
    });
    return res.json({ success: true, data: rating });
  } catch (err) {
    console.error('[Guest Portal] Review error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ─── SERVICES & ORDERS ──────────────────────

/**
 * GET /api/guest-portal/services?property_id=xxx
 */
router.get('/services', async (req, res) => {
  try {
    const propertyId = req.query.property_id;
    if (!propertyId) return res.status(400).json({ error: 'property_id requis' });

    const services = await prisma.service.findMany({
      where: { propertyId, available: true },
      orderBy: { category: 'asc' },
    });

    return res.json({
      success: true,
      data: services.map(s => ({
        id: s.id,
        name: s.name,
        name_en: s.nameEn,
        description: s.description,
        category: s.category.toLowerCase(),
        price: s.price / 100,
        currency: s.currency,
        image_url: s.imageUrl,
        available: s.available,
        stock: s.stock,
      })),
    });
  } catch (err) {
    console.error('[Guest Portal] Services error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/orders
 */
router.post('/orders', async (req, res) => {
  try {
    const { items } = req.body; // [{ service_id, quantity }]
    if (!items?.length) return res.status(400).json({ error: 'Items requis' });

    // Récupérer la réservation du guest
    const reservation = await prisma.reservation.findFirst({
      where: { guestId: req.guest.id, status: { not: 'CANCELLED' } },
      orderBy: { checkIn: 'desc' },
    });
    if (!reservation) return res.status(404).json({ error: 'Aucune réservation' });

    // Calculer le total
    const serviceIds = items.map(i => i.service_id);
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
    const serviceMap = Object.fromEntries(services.map(s => [s.id, s]));

    let totalAmount = 0;
    const orderItems = items.map(item => {
      const service = serviceMap[item.service_id];
      if (!service) throw new Error(`Service ${item.service_id} non trouvé`);
      totalAmount += service.price * item.quantity;
      return { serviceId: service.id, quantity: item.quantity, unitPrice: service.price };
    });

    // Create order as PENDING (awaiting payment)
    const order = await prisma.order.create({
      data: {
        reservationId: reservation.id,
        guestId: req.guest.id,
        totalAmount,
        status: 'PENDING',
        items: { create: orderItems },
      },
      include: { items: { include: { service: true } } },
    });

    // Create Stripe PaymentIntent
    let clientSecret = null;
    try {
      const pi = await stripeService.createPaymentIntent(totalAmount, 'eur', {
        orderId: order.id,
        guestId: req.guest.id,
        reservationId: reservation.id,
      });
      clientSecret = pi.clientSecret;
    } catch (stripeErr) {
      console.warn('[Guest Portal] Stripe PaymentIntent failed, order stays PENDING:', stripeErr.message);
    }

    return res.json({
      success: true,
      data: {
        id: order.id,
        total: order.totalAmount / 100,
        currency: order.currency || 'EUR',
        status: order.status.toLowerCase(),
        items: order.items.map(i => ({
          name: i.service.name,
          quantity: i.quantity,
          unit_price: i.unitPrice / 100,
        })),
        created_at: order.createdAt,
        clientSecret,
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Order error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/orders
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { guestId: req.guest.id },
      include: { items: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: orders.map(o => ({
        id: o.id,
        total: o.totalAmount / 100,
        currency: o.currency,
        status: o.status.toLowerCase(),
        items: o.items.map(i => ({
          name: i.service.name,
          quantity: i.quantity,
          unit_price: i.unitPrice / 100,
        })),
        created_at: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Guest Portal] Orders error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/orders/:id/cancel
 */
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    return res.json({ success: true, message: 'Commande annulée' });
  } catch (err) {
    console.error('[Guest Portal] Cancel order error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/orders/:id/confirm-payment
 * Verify Stripe payment and confirm order
 */
router.post('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId requis' });

    // Verify payment with Stripe
    const pi = await stripeService.confirmPaymentIntent(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: `Paiement non confirmé: ${pi.status}` });
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: {
        id: order.id,
        status: 'confirmed',
        paid_at: order.paidAt,
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Confirm payment error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/fcm-token
 * Register FCM token for push notifications
 */
router.post('/fcm-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token requis' });

    await prisma.guest.update({
      where: { id: req.guest.id },
      data: { fcmToken: token },
    });

    return res.json({ success: true, message: 'Token FCM enregistré' });
  } catch (err) {
    console.error('[Guest Portal] FCM token error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ─── CHAT / MESSAGING ──────────────────────

/**
 * GET /api/guest-portal/chat/host-status?reservation_id=xxx
 * Returns host name + average response time (KPI)
 */
router.get('/chat/host-status', async (req, res) => {
  try {
    const reservationId = req.query.reservation_id;
    if (!reservationId) return res.status(400).json({ error: 'reservation_id requis' });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { property: { include: { owner: true } } },
    });

    if (!reservation) return res.status(404).json({ error: 'Reservation non trouvee' });

    const hostName = reservation.property?.owner?.firstName || 'L\'hote';

    // Calculate avg response time from real messages
    const messages = await prisma.guestMessage.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'asc' },
      select: { senderType: true, createdAt: true },
    });

    let avgResponseMinutes = null;
    if (messages.length >= 2) {
      const responseTimes = [];
      let lastGuestTime = null;
      for (const msg of messages) {
        if (msg.senderType === 'GUEST') {
          lastGuestTime = msg.createdAt;
        } else if (msg.senderType === 'HOST' && lastGuestTime) {
          const diffMin = Math.round((msg.createdAt.getTime() - lastGuestTime.getTime()) / 60000);
          if (diffMin > 0 && diffMin < 1440) responseTimes.push(diffMin);
          lastGuestTime = null;
        }
      }
      if (responseTimes.length > 0) {
        avgResponseMinutes = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }
    }

    return res.json({
      success: true,
      data: { hostName, avgResponseMinutes, online: false },
    });
  } catch (err) {
    console.error('[Guest Portal] Host status error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/guest-portal/chat/messages?reservation_id=xxx
 */
router.get('/chat/messages', async (req, res) => {
  try {
    const reservationId = req.query.reservation_id;
    if (!reservationId) return res.status(400).json({ error: 'reservation_id requis' });

    const messages = await prisma.guestMessage.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      success: true,
      data: messages.map(m => ({
        id: m.id,
        sender_type: m.senderType.toLowerCase(),
        content: m.content,
        translated_content: m.translatedContent,
        read_at: m.readAt,
        created_at: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Guest Portal] Chat messages error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/chat/messages
 */
router.post('/chat/messages', async (req, res) => {
  try {
    const { text, reservation_id } = req.body;
    if (!text || !reservation_id) {
      return res.status(400).json({ error: 'text et reservation_id requis' });
    }

    const message = await prisma.guestMessage.create({
      data: {
        reservationId: reservation_id,
        senderId: req.guest.id,
        senderType: 'GUEST',
        content: text,
      },
    });

    // Email notification to property owner (guest → host)
    try {
      const resInfo = await prisma.reservation.findUnique({
        where: { id: reservation_id },
        include: { guest: true, property: { include: { owner: true } } },
      });
      if (resInfo?.property?.owner?.email) {
        const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/employee/dashboard`;
        await sendgridService.sendHostMessageNotification(resInfo.property.owner.email, {
          hostName: resInfo.property.owner.firstName || 'cher proprietaire',
          guestName: `${resInfo.guest?.firstName || ''} ${resInfo.guest?.lastName || ''}`.trim() || 'Un voyageur',
          messagePreview: text.length > 100 ? text.substring(0, 100) + '...' : text,
          propertyName: resInfo.property.name || 'votre logement',
          dashboardUrl,
        });
      }
    } catch (emailErr) {
      console.warn('[Guest Portal] Host email notification failed:', emailErr.message);
    }

    // NO fake auto-reply — return host status info in the response instead
    // The real host will reply manually, and we track their response time as a KPI

    return res.json({
      success: true,
      data: {
        id: message.id,
        sender_type: 'guest',
        content: message.content,
        created_at: message.createdAt,
      },
    });
  } catch (err) {
    console.error('[Guest Portal] Send message error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/chat/:id/read
 */
router.post('/chat/:id/read', async (req, res) => {
  try {
    await prisma.guestMessage.updateMany({
      where: { reservationId: req.params.id, senderType: 'HOST', readAt: null },
      data: { readAt: new Date() },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[Guest Portal] Mark read error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ─── HOST RECOMMENDATIONS CRUD ──────────────────────

/**
 * GET /api/guest-portal/property/:id/recommendations
 * Liste les recommandations de l'hôte pour une propriété
 */
router.get('/property/:id/recommendations', async (req, res) => {
  try {
    const recs = await prisma.hostRecommendation.findMany({
      where: { propertyId: req.params.id, active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: recs });
  } catch (err) {
    console.error('[Guest Portal] Get recommendations error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * POST /api/guest-portal/property/:id/recommendations
 * Ajouter une recommandation (réservé au propriétaire)
 */
router.post('/property/:id/recommendations', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { category, name, address, description, rating, latitude, longitude, mapsUrl, imageUrl, phone, website, sortOrder } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'name et category sont requis' });
    }

    const rec = await prisma.hostRecommendation.create({
      data: {
        propertyId,
        category: category.toUpperCase(),
        name,
        address: address || null,
        description: description || null,
        rating: rating ? parseFloat(rating) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        mapsUrl: mapsUrl || null,
        imageUrl: imageUrl || null,
        phone: phone || null,
        website: website || null,
        sortOrder: sortOrder || 0,
      },
    });

    // Invalidate guide cache for this property
    guideCache.delete(propertyId);

    return res.status(201).json({ success: true, data: rec });
  } catch (err) {
    console.error('[Guest Portal] Create recommendation error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * PUT /api/guest-portal/recommendations/:id
 * Modifier une recommandation
 */
router.put('/recommendations/:id', async (req, res) => {
  try {
    const { category, name, address, description, rating, latitude, longitude, mapsUrl, imageUrl, phone, website, sortOrder, active } = req.body;

    const rec = await prisma.hostRecommendation.update({
      where: { id: req.params.id },
      data: {
        ...(category && { category: category.toUpperCase() }),
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
        ...(rating !== undefined && { rating: rating ? parseFloat(rating) : null }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(mapsUrl !== undefined && { mapsUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    // Invalidate guide cache
    guideCache.delete(rec.propertyId);

    return res.json({ success: true, data: rec });
  } catch (err) {
    console.error('[Guest Portal] Update recommendation error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * DELETE /api/guest-portal/recommendations/:id
 * Supprimer une recommandation
 */
router.delete('/recommendations/:id', async (req, res) => {
  try {
    const rec = await prisma.hostRecommendation.delete({
      where: { id: req.params.id },
    });

    // Invalidate guide cache
    guideCache.delete(rec.propertyId);

    return res.json({ success: true });
  } catch (err) {
    console.error('[Guest Portal] Delete recommendation error:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

export default router;

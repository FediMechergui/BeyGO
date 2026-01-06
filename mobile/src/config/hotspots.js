// Hotspot configuration for AR locations
// These are the museum locations and AR marker hotspots

export const MUSEUMS = [
  {
    id: 'bardo',
    name: 'Bardo National Museum',
    nameAr: 'المتحف الوطني بباردو',
    nameFr: 'Musée National du Bardo',
    description: 'One of the most important museums in the Mediterranean region, housing exceptional collections from Tunisian history.',
    location: {
      latitude: 36.8089,
      longitude: 10.1341,
    },
    radius: 200, // meters
    hotspots: [
      {
        id: 'bardo_murad1',
        name: 'Murad I Bey Hall',
        location: { latitude: 36.8090, longitude: 10.1342 },
        radius: 15,
        beys: ['bey_murad_1'],
        puzzleId: 'puzzle_murad_dynasty',
        markerType: 'qr',
        qrCode: 'BEYGO_BARDO_MURAD1',
      },
      {
        id: 'bardo_hussein1',
        name: 'Hussein I Bey Gallery',
        location: { latitude: 36.8088, longitude: 10.1340 },
        radius: 15,
        beys: ['bey_hussein_1'],
        puzzleId: 'puzzle_husseinite_rise',
        markerType: 'qr',
        qrCode: 'BEYGO_BARDO_HUSSEIN1',
      },
      {
        id: 'bardo_artifacts',
        name: 'Beylical Artifacts Collection',
        location: { latitude: 36.8091, longitude: 10.1343 },
        radius: 20,
        beys: ['bey_ahmed_1', 'bey_muhammad_3'],
        puzzleId: 'puzzle_golden_age',
        markerType: 'location',
      },
    ],
  },
  {
    id: 'dar_hussein',
    name: 'Dar Hussein Palace',
    nameAr: 'دار حسين',
    nameFr: 'Palais Dar Hussein',
    description: 'Historic palace in the Medina of Tunis, now home to the National Institute of Heritage.',
    location: {
      latitude: 36.7986,
      longitude: 10.1697,
    },
    radius: 100,
    hotspots: [
      {
        id: 'dar_hussein_throne',
        name: 'Throne Room',
        location: { latitude: 36.7987, longitude: 10.1698 },
        radius: 10,
        beys: ['bey_hussein_2', 'bey_ali_2'],
        puzzleId: 'puzzle_palace_secrets',
        markerType: 'qr',
        qrCode: 'BEYGO_DARHUSSEIN_THRONE',
      },
      {
        id: 'dar_hussein_garden',
        name: 'Palace Gardens',
        location: { latitude: 36.7985, longitude: 10.1696 },
        radius: 25,
        beys: ['bey_mahmud_1'],
        puzzleId: 'puzzle_garden_treasures',
        markerType: 'location',
      },
    ],
  },
  {
    id: 'tourbet_bey',
    name: 'Tourbet El Bey',
    nameAr: 'تربة الباي',
    nameFr: 'Tourbet El Bey',
    description: 'Royal mausoleum of the Husseinite dynasty, final resting place of many Beys of Tunis.',
    location: {
      latitude: 36.7956,
      longitude: 10.1711,
    },
    radius: 80,
    hotspots: [
      {
        id: 'tourbet_main',
        name: 'Main Mausoleum',
        location: { latitude: 36.7957, longitude: 10.1712 },
        radius: 15,
        beys: ['bey_ali_1', 'bey_muhammad_1', 'bey_ali_2'],
        puzzleId: 'puzzle_eternal_rest',
        markerType: 'qr',
        qrCode: 'BEYGO_TOURBET_MAIN',
      },
      {
        id: 'tourbet_courtyard',
        name: 'Ceremonial Courtyard',
        location: { latitude: 36.7955, longitude: 10.1710 },
        radius: 20,
        beys: ['bey_hammouda_2'],
        puzzleId: 'puzzle_royal_legacy',
        markerType: 'location',
      },
    ],
  },
  {
    id: 'kasbah',
    name: 'Kasbah of Tunis',
    nameAr: 'قصبة تونس',
    nameFr: 'Kasbah de Tunis',
    description: 'Historic citadel and government center during the Beylical period.',
    location: {
      latitude: 36.8000,
      longitude: 10.1650,
    },
    radius: 150,
    hotspots: [
      {
        id: 'kasbah_square',
        name: 'Kasbah Square',
        location: { latitude: 36.8001, longitude: 10.1651 },
        radius: 30,
        beys: ['bey_hammouda_1', 'bey_murad_2'],
        puzzleId: 'puzzle_political_power',
        markerType: 'location',
      },
      {
        id: 'kasbah_mosque',
        name: 'Kasbah Mosque',
        location: { latitude: 36.7999, longitude: 10.1649 },
        radius: 20,
        beys: ['bey_murad_3'],
        puzzleId: 'puzzle_spiritual_authority',
        markerType: 'qr',
        qrCode: 'BEYGO_KASBAH_MOSQUE',
      },
    ],
  },
  {
    id: 'la_marsa',
    name: 'Bey Palace of La Marsa',
    nameAr: 'قصر الباي بالمرسى',
    nameFr: 'Palais Beylical de La Marsa',
    description: 'Summer palace of the Beys, overlooking the Mediterranean Sea.',
    location: {
      latitude: 36.8783,
      longitude: 10.3247,
    },
    radius: 120,
    hotspots: [
      {
        id: 'lamarsa_main',
        name: 'Main Palace Building',
        location: { latitude: 36.8784, longitude: 10.3248 },
        radius: 25,
        beys: ['bey_muhammad_4', 'bey_muhammad_5'],
        puzzleId: 'puzzle_summer_retreat',
        markerType: 'qr',
        qrCode: 'BEYGO_LAMARSA_PALACE',
      },
      {
        id: 'lamarsa_gardens',
        name: 'Royal Gardens',
        location: { latitude: 36.8782, longitude: 10.3246 },
        radius: 35,
        beys: ['bey_ahmad_2'],
        puzzleId: 'puzzle_seaside_serenity',
        markerType: 'location',
      },
    ],
  },
  {
    id: 'carthage',
    name: 'Carthage Presidential Palace',
    nameAr: 'قصر قرطاج',
    nameFr: 'Palais de Carthage',
    description: 'Historic site near ancient Carthage, significant during the late Beylical period.',
    location: {
      latitude: 36.8528,
      longitude: 10.3306,
    },
    radius: 200,
    hotspots: [
      {
        id: 'carthage_hill',
        name: 'Byrsa Hill',
        location: { latitude: 36.8530, longitude: 10.3308 },
        radius: 40,
        beys: ['bey_muhammad_6', 'bey_muhammad_7'],
        puzzleId: 'puzzle_final_dynasty',
        markerType: 'location',
      },
      {
        id: 'carthage_museum',
        name: 'Carthage Museum',
        location: { latitude: 36.8526, longitude: 10.3304 },
        radius: 20,
        beys: ['bey_muhammad_8'],
        puzzleId: 'puzzle_end_of_era',
        markerType: 'qr',
        qrCode: 'BEYGO_CARTHAGE_MUSEUM',
      },
    ],
  },
];

// Get all hotspots as a flat array
export const getAllHotspots = () => {
  return MUSEUMS.flatMap(museum => 
    museum.hotspots.map(hotspot => ({
      ...hotspot,
      museumId: museum.id,
      museumName: museum.name,
    }))
  );
};

// Get hotspot by ID
export const getHotspotById = (id) => {
  for (const museum of MUSEUMS) {
    const hotspot = museum.hotspots.find(h => h.id === id);
    if (hotspot) {
      return {
        ...hotspot,
        museumId: museum.id,
        museumName: museum.name,
      };
    }
  }
  return null;
};

// Get hotspot by QR code
export const getHotspotByQRCode = (qrCode) => {
  for (const museum of MUSEUMS) {
    const hotspot = museum.hotspots.find(h => h.qrCode === qrCode);
    if (hotspot) {
      return {
        ...hotspot,
        museumId: museum.id,
        museumName: museum.name,
      };
    }
  }
  return null;
};

// Get museum by ID
export const getMuseumById = (id) => {
  return MUSEUMS.find(m => m.id === id);
};

// Find nearest museum to given coordinates
export const findNearestMuseum = (latitude, longitude) => {
  let nearest = null;
  let minDistance = Infinity;

  for (const museum of MUSEUMS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      museum.location.latitude,
      museum.location.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...museum, distance };
    }
  }

  return nearest;
};

// Find hotspots within range
export const findHotspotsInRange = (latitude, longitude, maxRange = 1000) => {
  const hotspotsInRange = [];

  for (const museum of MUSEUMS) {
    const museumDistance = calculateDistance(
      latitude,
      longitude,
      museum.location.latitude,
      museum.location.longitude
    );

    if (museumDistance <= maxRange) {
      for (const hotspot of museum.hotspots) {
        const hotspotDistance = calculateDistance(
          latitude,
          longitude,
          hotspot.location.latitude,
          hotspot.location.longitude
        );

        if (hotspotDistance <= maxRange) {
          hotspotsInRange.push({
            ...hotspot,
            museumId: museum.id,
            museumName: museum.name,
            distance: hotspotDistance,
            isWithinRadius: hotspotDistance <= hotspot.radius,
          });
        }
      }
    }
  }

  return hotspotsInRange.sort((a, b) => a.distance - b.distance);
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Format distance for display
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export default {
  MUSEUMS,
  getAllHotspots,
  getHotspotById,
  getHotspotByQRCode,
  getMuseumById,
  findNearestMuseum,
  findHotspotsInRange,
  calculateDistance,
  formatDistance,
};

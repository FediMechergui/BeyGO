// Environment configuration
const ENV = {
  dev: {
    API_URL: 'http://10.154.62.116:5000/api', // Your local IP for Expo Go
    EMAILJS_SERVICE_ID: 'service_uf3zzhg',
    EMAILJS_PUBLIC_KEY: 'SPvZ0Rs6r2ZupqmZH',
    ENABLE_AR_DEBUG: true,
    DEV_MODE_AR: true, // Allow AR to work from any location
    DEV_AUTO_SCATTER_HOTSPOTS: true, // Auto-generate hotspots around user location
    DEV_SCATTER_RADIUS: 5, // meters - max radius to scatter hotspots (2-5m in dev)
    DEV_SCATTER_MIN_RADIUS: 2, // meters - minimum distance for hotspots
    DEV_SCATTER_COUNT: 9, // number of hotspots to generate (puzzle pieces)
    LOCATION_TRACKING_INTERVAL: 500, // ms - fast tracking for smooth AR
    PROXIMITY_THRESHOLD_IMMEDIATE: 10, // meters - can collect (tap to grab!)
    PROXIMITY_THRESHOLD_NEAR: 25, // meters - getting close (almost there!)
    PROXIMITY_THRESHOLD_APPROACHING: 50, // meters - approaching (on radar)
    // 3D Model for AR collectibles
    AR_COLLECTIBLE_MODEL_URL: 'https://sketchfab.com/models/81c8cae59eb14707b58a5660f0e6eba0/embed?autospin=1&autostart=1&transparent=1',
    AR_COLLECTIBLE_MODEL_ID: '81c8cae59eb14707b58a5660f0e6eba0',
  },
  staging: {
    API_URL: 'https://staging-api.beygo.app/api',
    EMAILJS_SERVICE_ID: 'service_uf3zzhg',
    EMAILJS_PUBLIC_KEY: 'SPvZ0Rs6r2ZupqmZH',
    ENABLE_AR_DEBUG: false,
    DEV_MODE_AR: false,
    DEV_AUTO_SCATTER_HOTSPOTS: false,
    DEV_SCATTER_RADIUS: 100,
    DEV_SCATTER_COUNT: 9,
    LOCATION_TRACKING_INTERVAL: 10000,
    PROXIMITY_THRESHOLD_IMMEDIATE: 10,
    PROXIMITY_THRESHOLD_NEAR: 50,
    PROXIMITY_THRESHOLD_APPROACHING: 100,
    AR_COLLECTIBLE_MODEL_URL: '',
    AR_COLLECTIBLE_MODEL_ID: '81c8cae59eb14707b58a5660f0e6eba0',
  },
  prod: {
    API_URL: 'https://api.beygo.app/api',
    EMAILJS_SERVICE_ID: 'service_uf3zzhg',
    EMAILJS_PUBLIC_KEY: 'SPvZ0Rs6r2ZupqmZH',
    ENABLE_AR_DEBUG: false,
    DEV_MODE_AR: false,
    LOCATION_TRACKING_INTERVAL: 15000,
    PROXIMITY_THRESHOLD_IMMEDIATE: 10,
    PROXIMITY_THRESHOLD_NEAR: 50,
    PROXIMITY_THRESHOLD_APPROACHING: 100,
  },
};

const getEnvVars = (env = 'dev') => {
  if (env === 'development' || env === 'dev') {
    return ENV.dev;
  } else if (env === 'staging') {
    return ENV.staging;
  } else if (env === 'production' || env === 'prod') {
    return ENV.prod;
  }
  return ENV.dev;
};

// Determine environment
const releaseChannel = process.env.EXPO_PUBLIC_RELEASE_CHANNEL || 'dev';
const config = getEnvVars(releaseChannel);

export default config;

export const {
  API_URL,
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  ENABLE_AR_DEBUG,
  DEV_MODE_AR,
  LOCATION_TRACKING_INTERVAL,
  PROXIMITY_THRESHOLD_IMMEDIATE,
  PROXIMITY_THRESHOLD_NEAR,
  PROXIMITY_THRESHOLD_APPROACHING,
} = config;

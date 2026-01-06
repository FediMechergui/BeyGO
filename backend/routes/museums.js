const express = require('express');
const router = express.Router();
const Museum = require('../models/Museum');
const Bey = require('../models/Bey');
const { protect } = require('../middleware/auth');

// Logging helper
const logMuseum = (action, museum) => {
  console.log(`[MUSEUM] ${action}: ${museum.name}`);
  console.log(`  📍 Location: ${museum.location?.coordinates?.latitude}, ${museum.location?.coordinates?.longitude}`);
  console.log(`  🎯 Radius: ${museum.location?.radius || 100}m`);
  if (museum.arHotspots?.length) {
    console.log(`  🔥 AR Hotspots: ${museum.arHotspots.length}`);
    museum.arHotspots.forEach((h, i) => {
      const coords = h.location?.coordinates || [0, 0];
      console.log(`    ${i+1}. ${h.name} - Piece #${h.puzzlePieceIndex + 1} at [${coords[1]}, ${coords[0]}]`);
    });
  }
};

// @route   GET /api/museums
// @desc    Get all museums
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { active = true } = req.query;

    const museums = await Museum.find({ isActive: active })
      .select('-arHotspots')
      .sort({ name: 1 });

    console.log(`[MUSEUMS] Fetched ${museums.length} museums`);
    museums.forEach(m => {
      console.log(`  - ${m.name}: ${m.location?.coordinates?.latitude}, ${m.location?.coordinates?.longitude}`);
    });

    res.json({
      success: true,
      count: museums.length,
      data: museums
    });
  } catch (error) {
    console.error('[MUSEUMS] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching museums',
      error: error.message
    });
  }
});

// @route   GET /api/museums/nearby
// @desc    Get museums near user location
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // radius in meters

    console.log(`[MUSEUMS/NEARBY] Request from user at: ${latitude}, ${longitude} (radius: ${radius}m)`);

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates required'
      });
    }

    const museums = await Museum.find({ isActive: true });

    // Calculate distance and filter
    const nearbyMuseums = museums
      .map(museum => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          museum.location.coordinates.latitude,
          museum.location.coordinates.longitude
        );
        return {
          ...museum.toObject(),
          distance: Math.round(distance)
        };
      })
      .filter(m => m.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    console.log(`[MUSEUMS/NEARBY] Found ${nearbyMuseums.length} museums within ${radius}m:`);
    nearbyMuseums.forEach(m => {
      console.log(`  - ${m.name}: ${m.distance}m away`);
    });

    res.json({
      success: true,
      count: nearbyMuseums.length,
      data: nearbyMuseums
    });
  } catch (error) {
    console.error('[MUSEUMS/NEARBY] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby museums',
      error: error.message
    });
  }
});

// @route   GET /api/museums/detect
// @desc    Detect current museum based on location
// @access  Public
router.get('/detect', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates required'
      });
    }

    const museums = await Museum.find({ isActive: true });

    // Find museum user is inside
    const currentMuseum = museums.find(museum => 
      museum.isUserInRange(parseFloat(latitude), parseFloat(longitude))
    );

    if (!currentMuseum) {
      return res.json({
        success: true,
        detected: false,
        message: 'No museum detected at your location',
        data: null
      });
    }

    // Get beys for this museum
    const beys = await Bey.find({ 
      primaryMuseum: currentMuseum._id,
      isActive: true 
    })
    .populate('dynasty', 'name displayName color')
    .select('name reignStart reignEnd portraitImage puzzle.totalPieces');

    res.json({
      success: true,
      detected: true,
      message: `Welcome to ${currentMuseum.name}!`,
      data: {
        museum: currentMuseum,
        availableBeys: beys
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error detecting museum',
      error: error.message
    });
  }
});

// @route   GET /api/museums/:id
// @desc    Get single museum with available beys
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const museum = await Museum.findById(req.params.id);

    if (!museum) {
      return res.status(404).json({
        success: false,
        message: 'Museum not found'
      });
    }

    // Get beys associated with this museum
    const beys = await Bey.find({ 
      $or: [
        { primaryMuseum: req.params.id },
        { otherMuseums: req.params.id }
      ],
      isActive: true
    })
    .populate('dynasty', 'name displayName color')
    .select('name reignStart reignEnd title dynasty portraitImage')
    .sort({ reignStart: 1 });

    res.json({
      success: true,
      data: {
        ...museum.toObject(),
        availableBeys: beys
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching museum',
      error: error.message
    });
  }
});

// @route   GET /api/museums/:id/beys
// @desc    Get all beys in a museum
// @access  Public
router.get('/:id/beys', async (req, res) => {
  try {
    const museum = await Museum.findById(req.params.id);

    if (!museum) {
      return res.status(404).json({
        success: false,
        message: 'Museum not found'
      });
    }

    const beys = await Bey.find({ 
      $or: [
        { primaryMuseum: req.params.id },
        { otherMuseums: req.params.id }
      ],
      isActive: true
    })
    .populate('dynasty', 'name displayName color')
    .populate('mainCurrency', 'name')
    .sort({ reignStart: 1 });

    res.json({
      success: true,
      count: beys.length,
      data: {
        museum: {
          id: museum._id,
          name: museum.name
        },
        beys
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching beys',
      error: error.message
    });
  }
});

// @route   GET /api/museums/:id/hotspots
// @desc    Get AR hotspots for a museum (for puzzle piece collection)
// @access  Private (requires being at museum)
router.get('/:id/hotspots', protect, async (req, res) => {
  try {
    const { latitude, longitude, devMode } = req.query;
    const museum = await Museum.findById(req.params.id);

    if (!museum) {
      return res.status(404).json({
        success: false,
        message: 'Museum not found'
      });
    }

    console.log(`\n[HOTSPOTS] Request for museum: ${museum.name}`);
    console.log(`  👤 User location: ${latitude}, ${longitude}`);
    console.log(`  🏛️ Museum location: ${museum.location?.coordinates?.latitude}, ${museum.location?.coordinates?.longitude}`);
    console.log(`  🔧 Dev mode: ${devMode === 'true'}`);

    // Skip range check in dev mode
    if (devMode !== 'true' && latitude && longitude) {
      const isInRange = museum.isUserInRange(
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      
      if (!isInRange) {
        console.log(`  ❌ User out of range - access denied`);
        return res.status(403).json({
          success: false,
          message: 'You must be at the museum to access AR hotspots'
        });
      }
    }

    // Log hotspot details
    console.log(`  ✅ Returning ${museum.arHotspots?.length || 0} hotspots:`);
    if (museum.arHotspots?.length) {
      museum.arHotspots.forEach((h, i) => {
        const coords = h.location?.coordinates || [0, 0];
        console.log(`    ${i+1}. "${h.name}" - Piece #${h.puzzlePieceIndex + 1}`);
        console.log(`       📍 [lng: ${coords[0]}, lat: ${coords[1]}]`);
        console.log(`       📏 Trigger: ${h.triggerRadius}m | Type: ${h.type}`);
      });
    }

    res.json({
      success: true,
      data: {
        museum: museum.name,
        hotspots: museum.arHotspots
      }
    });
  } catch (error) {
    console.error('[HOTSPOTS] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotspots',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = router;

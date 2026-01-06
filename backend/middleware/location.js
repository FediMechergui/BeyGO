const Museum = require('../models/Museum');

// Verify user is at museum location
const verifyLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, museumId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    if (!museumId) {
      return res.status(400).json({
        success: false,
        message: 'Museum ID is required'
      });
    }

    const museum = await Museum.findById(museumId);

    if (!museum) {
      return res.status(404).json({
        success: false,
        message: 'Museum not found'
      });
    }

    const isInRange = museum.isUserInRange(latitude, longitude);

    if (!isInRange) {
      return res.status(403).json({
        success: false,
        message: 'You must be at the museum to perform this action',
        data: {
          museum: museum.name,
          requiredLocation: museum.location.coordinates,
          yourLocation: { latitude, longitude },
          radius: museum.location.radius
        }
      });
    }

    // Attach museum to request for later use
    req.museum = museum;
    req.locationVerified = true;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying location',
      error: error.message
    });
  }
};

// Optional location verification (doesn't block but adds flag)
const checkLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, museumId } = req.body;

    if (latitude && longitude && museumId) {
      const museum = await Museum.findById(museumId);
      if (museum) {
        req.locationVerified = museum.isUserInRange(latitude, longitude);
        req.museum = museum;
      }
    }

    next();
  } catch (error) {
    // Don't block on error, just continue
    req.locationVerified = false;
    next();
  }
};

module.exports = { verifyLocation, checkLocation };

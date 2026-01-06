const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Museum = require('../models/Museum');
const { protect } = require('../middleware/auth');
const { verifyLocation, checkLocation } = require('../middleware/location');

// @route   POST /api/visits/start
// @desc    Start a new museum visit
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { museumId, latitude, longitude, verificationMethod = 'gps' } = req.body;

    // Check if museum exists
    const museum = await Museum.findById(museumId);
    if (!museum) {
      return res.status(404).json({
        success: false,
        message: 'Museum not found'
      });
    }

    // Verify location if GPS method
    let locationVerified = false;
    if (verificationMethod === 'gps' && latitude && longitude) {
      locationVerified = museum.isUserInRange(latitude, longitude);
    } else if (verificationMethod === 'qr_code') {
      // QR code verification would be validated differently
      locationVerified = true;
    }

    // Check for active visit
    const activeVisit = await Visit.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (activeVisit) {
      // End previous visit
      activeVisit.status = 'completed';
      activeVisit.endDate = new Date();
      await activeVisit.save();
    }

    // Create new visit
    const visit = await Visit.create({
      user: req.user._id,
      museum: museumId,
      locationVerified,
      verificationMethod,
      pathHistory: latitude && longitude ? [{
        latitude,
        longitude,
        timestamp: new Date()
      }] : []
    });

    // Increment museum visit count
    await Museum.findByIdAndUpdate(museumId, { $inc: { totalVisits: 1 } });

    await visit.populate('museum', 'name location images');

    res.status(201).json({
      success: true,
      message: `Visit started at ${museum.name}`,
      data: {
        visit,
        locationVerified,
        museum: {
          id: museum._id,
          name: museum.name,
          focus: museum.focus
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting visit',
      error: error.message
    });
  }
});

// @route   PUT /api/visits/:id/end
// @desc    End a museum visit
// @access  Private
router.put('/:id/end', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const visit = await Visit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (visit.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Visit is not active'
      });
    }

    visit.status = 'completed';
    visit.endDate = new Date();
    if (rating) visit.rating = rating;
    if (feedback) visit.feedback = feedback;

    await visit.save();
    await visit.populate('museum', 'name');
    await visit.populate('challenges', 'bey status totalPoints');

    res.json({
      success: true,
      message: 'Visit completed',
      data: {
        visit,
        duration: visit.duration,
        pointsEarned: visit.pointsEarned
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ending visit',
      error: error.message
    });
  }
});

// @route   GET /api/visits/active
// @desc    Get user's active visit
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const visit = await Visit.findOne({
      user: req.user._id,
      status: 'active'
    })
    .populate('museum', 'name location images arHotspots')
    .populate({
      path: 'challenges',
      populate: { path: 'bey', select: 'name portraitImage' }
    });

    if (!visit) {
      return res.json({
        success: true,
        data: null,
        message: 'No active visit'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active visit',
      error: error.message
    });
  }
});

// @route   PUT /api/visits/:id/location
// @desc    Update visit path history
// @access  Private
router.put('/:id/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates required'
      });
    }

    const visit = await Visit.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'active'
      },
      {
        $push: {
          pathHistory: {
            latitude,
            longitude,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Active visit not found'
      });
    }

    res.json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// @route   GET /api/visits/:id
// @desc    Get visit details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const visit = await Visit.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('museum', 'name location images')
    .populate({
      path: 'challenges',
      populate: [
        { path: 'bey', select: 'name portraitImage reignStart reignEnd' }
      ]
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visit',
      error: error.message
    });
  }
});

module.exports = router;

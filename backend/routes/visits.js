const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Museum = require('../models/Museum');
const { protect } = require('../middleware/auth');
const { verifyLocation, checkLocation } = require('../middleware/location');

/**
 * @swagger
 * /visits/start:
 *   post:
 *     summary: Start a new museum visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - museumId
 *             properties:
 *               museumId:
 *                 type: string
 *                 description: Museum ID to start visit at
 *               latitude:
 *                 type: number
 *                 description: User's current latitude
 *               longitude:
 *                 type: number
 *                 description: User's current longitude
 *               verificationMethod:
 *                 type: string
 *                 enum: [gps, qr_code]
 *                 default: gps
 *     responses:
 *       201:
 *         description: Visit started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     visit:
 *                       $ref: '#/components/schemas/Visit'
 *                     locationVerified:
 *                       type: boolean
 *                     museum:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Museum not found
 */
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

/**
 * @swagger
 * /visits/{id}/end:
 *   put:
 *     summary: End a museum visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     visit:
 *                       $ref: '#/components/schemas/Visit'
 *                     duration:
 *                       type: integer
 *                     pointsEarned:
 *                       type: integer
 *       400:
 *         description: Visit is not active
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /visits/active:
 *   get:
 *     summary: Get user's active visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active visit details or null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hasActiveVisit:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Visit'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

// @route   GET /api/visits/history
// @desc    Get user's visit history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { limit = 20, status } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;

    const visits = await Visit.find(query)
      .populate('museum', 'name location images')
      .sort({ startDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visit history',
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

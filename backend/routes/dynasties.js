const express = require('express');
const router = express.Router();
const Dynasty = require('../models/Dynasty');
const Bey = require('../models/Bey');

// @route   GET /api/dynasties
// @desc    Get all dynasties
// @access  Public
router.get('/', async (req, res) => {
  try {
    const dynasties = await Dynasty.find().sort({ startYear: 1 });

    // Get bey count for each dynasty
    const dynastiesWithCounts = await Promise.all(
      dynasties.map(async (dynasty) => {
        const beyCount = await Bey.countDocuments({ dynasty: dynasty._id });
        return {
          ...dynasty.toObject(),
          beyCount
        };
      })
    );

    res.json({
      success: true,
      count: dynasties.length,
      data: dynastiesWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dynasties',
      error: error.message
    });
  }
});

// @route   GET /api/dynasties/:id
// @desc    Get single dynasty with its beys
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const dynasty = await Dynasty.findById(req.params.id);

    if (!dynasty) {
      return res.status(404).json({
        success: false,
        message: 'Dynasty not found'
      });
    }

    const beys = await Bey.find({ dynasty: req.params.id })
      .select('name reignStart reignEnd portraitImage successionRelation reignEndType')
      .sort({ reignStart: 1 });

    res.json({
      success: true,
      data: {
        dynasty,
        beys,
        beyCount: beys.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dynasty',
      error: error.message
    });
  }
});

module.exports = router;

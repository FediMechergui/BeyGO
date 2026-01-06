const express = require('express');
const router = express.Router();
const Bey = require('../models/Bey');
const PuzzleChallenge = require('../models/PuzzleChallenge');
// Import models that are populated to ensure they're registered
require('../models/Currency');
require('../models/Dynasty');
require('../models/Museum');
const { protect } = require('../middleware/auth');

// @route   GET /api/beys
// @desc    Get all beys
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { dynasty, museum, page = 1, limit = 50 } = req.query;

    const query = { isActive: true };
    if (dynasty) query.dynasty = dynasty;
    if (museum) query.primaryMuseum = museum;

    const beys = await Bey.find(query)
      .populate('dynasty', 'name displayName color')
      .populate('primaryMuseum', 'name location.address')
      .populate('mainCurrency', 'name')
      .select('-biography -funFacts')
      .sort({ reignStart: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bey.countDocuments(query);

    res.json({
      success: true,
      count: beys.length,
      data: {
        beys,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
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

// @route   GET /api/beys/timeline
// @desc    Get beys in timeline format
// @access  Public
router.get('/timeline', async (req, res) => {
  try {
    const beys = await Bey.find({ isActive: true })
      .populate('dynasty', 'name displayName color')
      .select('name reignStart reignEnd dynasty portraitImage reignEndType')
      .sort({ reignStart: 1 });

    // Return flat array for easier frontend consumption
    res.json({
      success: true,
      count: beys.length,
      data: beys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching timeline',
      error: error.message
    });
  }
});

// @route   GET /api/beys/:id
// @desc    Get single bey details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bey = await Bey.findById(req.params.id)
      .populate('dynasty', 'name displayName color description')
      .populate('primaryMuseum', 'name location images')
      .populate('otherMuseums', 'name location.address')
      .populate('mainCurrency', 'name period material image')
      .populate('mainResidence', 'name location status description images')
      .populate('successionRelation.predecessor', 'name reignStart reignEnd')
      .populate('successionRelation.successor', 'name reignStart reignEnd');

    if (!bey) {
      return res.status(404).json({
        success: false,
        message: 'Bey not found'
      });
    }

    res.json({
      success: true,
      data: bey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bey',
      error: error.message
    });
  }
});

// @route   GET /api/beys/:id/puzzle-info
// @desc    Get puzzle information for a bey (without revealing full image)
// @access  Public
router.get('/:id/puzzle-info', async (req, res) => {
  try {
    const bey = await Bey.findById(req.params.id)
      .select('name puzzle pointsValue completionReward timesCompleted averageCompletionTime');

    if (!bey) {
      return res.status(404).json({
        success: false,
        message: 'Bey not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: bey.name,
        puzzle: bey.puzzle,
        pointsValue: bey.pointsValue,
        reward: bey.completionReward,
        stats: {
          timesCompleted: bey.timesCompleted,
          averageTime: bey.averageCompletionTime
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching puzzle info',
      error: error.message
    });
  }
});

// @route   GET /api/beys/:id/user-progress
// @desc    Get user's progress on a specific bey puzzle
// @access  Private
router.get('/:id/user-progress', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOne({
      user: req.user._id,
      bey: req.params.id
    }).sort({ startedAt: -1 });

    if (!challenge) {
      return res.json({
        success: true,
        data: {
          hasStarted: false,
          completed: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasStarted: true,
        completed: challenge.status === 'completed',
        status: challenge.status,
        piecesCollected: challenge.collectedPieces.length,
        totalPieces: challenge.totalPieces,
        completionPercentage: challenge.completionPercentage,
        pointsEarned: challenge.status === 'completed' ? challenge.totalPoints : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
});

// @route   GET /api/beys/search/:query
// @desc    Search beys by name
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;

    const beys = await Bey.find({
      $text: { $search: searchQuery },
      isActive: true
    })
    .populate('dynasty', 'name displayName color')
    .select('name reignStart reignEnd portraitImage dynasty')
    .limit(10);

    res.json({
      success: true,
      count: beys.length,
      data: beys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching beys',
      error: error.message
    });
  }
});

module.exports = router;

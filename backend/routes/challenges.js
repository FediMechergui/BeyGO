const express = require('express');
const router = express.Router();
const PuzzleChallenge = require('../models/PuzzleChallenge');
const Visit = require('../models/Visit');
const Bey = require('../models/Bey');
const User = require('../models/User');
const Reward = require('../models/Reward');
const UserReward = require('../models/UserReward');
// Import models that are populated to ensure they're registered
require('../models/Currency');
require('../models/Dynasty');
require('../models/Museum');
const { protect } = require('../middleware/auth');

// @route   POST /api/challenges/start
// @desc    Start a puzzle challenge for a bey
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { beyId, visitId, museumId, latitude, longitude } = req.body;

    // Verify bey exists
    const bey = await Bey.findById(beyId).populate('primaryMuseum');
    if (!bey) {
      return res.status(404).json({
        success: false,
        message: 'Bey not found'
      });
    }

    // Check if user has an active visit
    let visit;
    if (visitId) {
      visit = await Visit.findOne({
        _id: visitId,
        user: req.user._id,
        status: 'active'
      });
    } else {
      visit = await Visit.findOne({
        user: req.user._id,
        status: 'active'
      });
    }

    if (!visit) {
      return res.status(400).json({
        success: false,
        message: 'You must start a museum visit first'
      });
    }

    // Check for existing active challenge for this bey
    const existingChallenge = await PuzzleChallenge.findOne({
      user: req.user._id,
      bey: beyId,
      status: { $in: ['active', 'paused'] }
    });

    if (existingChallenge) {
      // Return existing challenge
      await existingChallenge.populate('bey', 'name puzzle');
      return res.json({
        success: true,
        message: 'Continuing existing challenge',
        data: {
          challenge: existingChallenge,
          isExisting: true
        }
      });
    }

    // Check if already completed this bey
    const completedChallenge = await PuzzleChallenge.findOne({
      user: req.user._id,
      bey: beyId,
      status: 'completed'
    });

    if (completedChallenge) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this bey\'s puzzle',
        data: {
          completedAt: completedChallenge.completedAt,
          pointsEarned: completedChallenge.totalPoints
        }
      });
    }

    // Create new challenge
    const challenge = await PuzzleChallenge.create({
      user: req.user._id,
      bey: beyId,
      visit: visit._id,
      museum: museumId || visit.museum,
      totalPieces: bey.puzzle.totalPieces,
      basePoints: bey.pointsValue
    });

    // Add challenge to visit
    await Visit.findByIdAndUpdate(visit._id, {
      $push: { challenges: challenge._id }
    });

    // Log AR interaction
    challenge.arInteractions.push({
      type: 'ar_view_opened',
      data: { location: { latitude, longitude } }
    });
    await challenge.save();

    await challenge.populate('bey', 'name puzzle primaryMuseum');

    res.status(201).json({
      success: true,
      message: `Challenge started for ${bey.name}`,
      data: {
        challenge,
        puzzleGrid: {
          rows: bey.puzzle.gridSize.rows,
          cols: bey.puzzle.gridSize.cols,
          totalPieces: bey.puzzle.totalPieces
        },
        isExisting: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting challenge',
      error: error.message
    });
  }
});

// @route   POST /api/challenges/:id/collect-piece
// @desc    Collect a puzzle piece (AR interaction)
// @access  Private
router.post('/:id/collect-piece', protect, async (req, res) => {
  try {
    const { pieceIndex, latitude, longitude, hotspotName } = req.body;

    if (pieceIndex === undefined || pieceIndex < 0 || pieceIndex > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid piece index (must be 0-8)'
      });
    }

    const challenge = await PuzzleChallenge.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Active challenge not found'
      });
    }

    // Collect the piece
    const result = challenge.collectPiece(pieceIndex, {
      latitude,
      longitude,
      hotspotName
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await challenge.save();

    // If puzzle completed
    if (result.isComplete) {
      // Update bey stats
      const bey = await Bey.findById(challenge.bey);
      const newAvgTime = bey.timesCompleted === 0
        ? challenge.completionTime / 60
        : (bey.averageCompletionTime * bey.timesCompleted + challenge.completionTime / 60) / (bey.timesCompleted + 1);

      await Bey.findByIdAndUpdate(challenge.bey, {
        $inc: { timesCompleted: 1 },
        averageCompletionTime: Math.round(newAvgTime)
      });

      // Update user points and completed beys
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalPoints: challenge.totalPoints },
        $addToSet: { completedBeys: challenge.bey }
      });

      // Update visit points
      await Visit.findByIdAndUpdate(challenge.visit, {
        $inc: { pointsEarned: challenge.totalPoints }
      });

      // Grant reward
      const reward = await Reward.findOne({ bey: challenge.bey, isActive: true });
      let userReward = null;

      if (reward) {
        userReward = await UserReward.create({
          user: req.user._id,
          reward: reward._id,
          earnedFrom: {
            challenge: challenge._id,
            bey: challenge.bey
          },
          expiresAt: reward.validUntil
        });
      }

      await challenge.populate('bey', 'name portraitImage puzzleImage reignEndMessage completionReward');

      return res.json({
        success: true,
        message: 'Puzzle completed! 🎉',
        data: {
          completed: true,
          challenge: {
            id: challenge._id,
            completionTime: challenge.completionTime,
            totalPoints: challenge.totalPoints,
            bonusPoints: challenge.bonusPoints,
            penaltyPoints: challenge.penaltyPoints
          },
          bey: {
            name: challenge.bey.name,
            portrait: challenge.bey.portraitImage,
            puzzleImage: challenge.bey.puzzleImage,
            reignEndMessage: challenge.bey.reignEndMessage,
            reward: challenge.bey.completionReward
          },
          userReward: userReward ? {
            id: userReward._id,
            redemptionCode: userReward.redemptionCode
          } : null
        }
      });
    }

    res.json({
      success: true,
      message: `Piece ${pieceIndex + 1} collected!`,
      data: {
        completed: false,
        piecesCollected: result.piecesCollected,
        piecesRemaining: challenge.piecesRemaining,
        completionPercentage: challenge.completionPercentage,
        collectedPieces: challenge.collectedPieces.map(p => p.pieceIndex)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error collecting piece',
      error: error.message
    });
  }
});

// @route   POST /api/challenges/:id/use-hint
// @desc    Use a hint to find next piece
// @access  Private
router.post('/:id/use-hint', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active'
    }).populate('museum', 'arHotspots');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Active challenge not found'
      });
    }

    const result = challenge.useHint();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await challenge.save();

    // Find hotspot for the hint piece
    const hotspot = challenge.museum.arHotspots?.find(
      h => h.puzzlePieceIndex === result.hintPieceIndex
    );

    res.json({
      success: true,
      message: 'Hint used!',
      data: {
        hintsRemaining: result.hintsRemaining,
        hintPieceIndex: result.hintPieceIndex,
        hotspot: hotspot ? {
          name: hotspot.name,
          description: hotspot.description,
          floor: hotspot.floor
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error using hint',
      error: error.message
    });
  }
});

// @route   PUT /api/challenges/:id/pause
// @desc    Pause a challenge
// @access  Private
router.put('/:id/pause', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'active'
      },
      { status: 'paused' },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Active challenge not found'
      });
    }

    res.json({
      success: true,
      message: 'Challenge paused',
      data: {
        challengeId: challenge._id,
        progress: challenge.completionPercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error pausing challenge',
      error: error.message
    });
  }
});

// @route   PUT /api/challenges/:id/resume
// @desc    Resume a paused challenge
// @access  Private
router.put('/:id/resume', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'paused'
      },
      { status: 'active' },
      { new: true }
    ).populate('bey', 'name puzzle');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Paused challenge not found'
      });
    }

    res.json({
      success: true,
      message: 'Challenge resumed',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resuming challenge',
      error: error.message
    });
  }
});

// @route   PUT /api/challenges/:id/abandon
// @desc    Abandon a challenge
// @access  Private
router.put('/:id/abandon', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: { $in: ['active', 'paused'] }
      },
      { status: 'abandoned' },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      message: 'Challenge abandoned'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error abandoning challenge',
      error: error.message
    });
  }
});

// @route   GET /api/challenges/:id
// @desc    Get challenge details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const challenge = await PuzzleChallenge.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('bey', 'name portraitImage puzzleImage puzzle reignEndMessage')
    .populate('museum', 'name arHotspots');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching challenge',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visit = require('../models/Visit');
const PuzzleChallenge = require('../models/PuzzleChallenge');
const UserReward = require('../models/UserReward');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedBeys', 'name portraitImage dynasty reignStart reignEnd')
      .populate('favoriteMuseums', 'name location.address images');

    // Get user stats
    const totalVisits = await Visit.countDocuments({ user: req.user._id });
    const completedChallenges = await PuzzleChallenge.countDocuments({ 
      user: req.user._id, 
      status: 'completed' 
    });
    const rewards = await UserReward.find({ user: req.user._id })
      .populate('reward', 'name type discountPercentage');

    res.json({
      success: true,
      data: {
        ...user.getPublicProfile(),
        stats: {
          totalVisits,
          completedChallenges,
          totalRewards: rewards.length,
          availableRewards: rewards.filter(r => r.status === 'available').length
        },
        rewards: rewards.slice(0, 5) // Latest 5 rewards
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { username } = req.body;
    const updates = {};

    if (username) {
      // Check if username is taken
      const existing = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updates.username = username;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated',
      data: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// @route   POST /api/users/profile/image
// @desc    Upload profile image
// @access  Private
router.post('/profile/image', protect, uploadSingle('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile image uploaded',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// @route   GET /api/users/visits
// @desc    Get user visit history
// @access  Private
router.get('/visits', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const visits = await Visit.find({ user: req.user._id })
      .populate('museum', 'name location.address images')
      .populate('challenges', 'bey status completedAt totalPoints')
      .sort({ visitDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Visit.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        visits,
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
      message: 'Error fetching visits',
      error: error.message
    });
  }
});

// @route   GET /api/users/challenges
// @desc    Get user puzzle challenges
// @access  Private
router.get('/challenges', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;

    const challenges = await PuzzleChallenge.find(query)
      .populate('bey', 'name portraitImage dynasty')
      .populate('museum', 'name')
      .sort({ startedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PuzzleChallenge.countDocuments(query);

    res.json({
      success: true,
      data: {
        challenges,
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
      message: 'Error fetching challenges',
      error: error.message
    });
  }
});

// @route   GET /api/users/rewards
// @desc    Get user rewards
// @access  Private
router.get('/rewards', protect, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;

    const rewards = await UserReward.find(query)
      .populate('reward')
      .populate('earnedFrom.bey', 'name')
      .sort({ earnedAt: -1 });

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rewards',
      error: error.message
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await User.find()
      .select('username profileImage totalPoints completedBeys')
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: leaderboard.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        profileImage: user.profileImage,
        totalPoints: user.totalPoints,
        beysCompleted: user.completedBeys.length
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

// @route   PUT /api/users/location
// @desc    Update user location
// @access  Private
router.put('/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates required'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      lastLocation: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });

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

module.exports = router;

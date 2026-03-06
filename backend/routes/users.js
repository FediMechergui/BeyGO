const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visit = require('../models/Visit');
const PuzzleChallenge = require('../models/PuzzleChallenge');
const UserReward = require('../models/UserReward');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile with stats
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalVisits:
 *                           type: integer
 *                         completedChallenges:
 *                           type: integer
 *                         totalRewards:
 *                           type: integer
 *                         availableRewards:
 *                           type: integer
 *                     rewards:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserReward'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *     responses:
 *       200:
 *         description: Profile updated
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Username already taken
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /users/profile/image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, etc.)
 *     responses:
 *       200:
 *         description: Profile image uploaded
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
 *                     profileImage:
 *                       type: string
 *       400:
 *         description: No image uploaded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /users/visits:
 *   get:
 *     summary: Get user visit history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of user visits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     visits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Visit'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

// @route   GET /api/users/me/stats
// @desc    Get detailed user stats
// @access  Private
router.get('/me/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const totalVisits = await Visit.countDocuments({ user: req.user._id });
    const completedChallenges = await PuzzleChallenge.countDocuments({ 
      user: req.user._id, 
      status: 'completed' 
    });
    const activeChallenges = await PuzzleChallenge.countDocuments({ 
      user: req.user._id, 
      status: 'active' 
    });
    const rewards = await UserReward.countDocuments({ user: req.user._id });
    
    // Calculate total games played (challenges)
    const gamesPlayed = await PuzzleChallenge.countDocuments({ user: req.user._id });
    
    // Get unique museums visited
    const uniqueMuseums = await Visit.distinct('museum', { user: req.user._id });

    res.json({
      success: true,
      data: {
        totalPoints: user.totalPoints || 0,
        totalVisits,
        uniqueMuseumsVisited: uniqueMuseums.length,
        completedChallenges,
        activeChallenges,
        totalRewards: rewards,
        gamesPlayed,
        level: Math.floor((user.totalPoints || 0) / 500) + 1,
        completedBeys: user.completedBeys?.length || 0,
        streak: user.currentStreak || 0,
        lastActive: user.lastLoginAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard with time period filter
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 20, period = 'allTime' } = req.query;

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch(period) {
      case 'daily':
        dateFilter = { 
          lastLoginAt: { 
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) 
          } 
        };
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { lastLoginAt: { $gte: weekAgo } };
        break;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { lastLoginAt: { $gte: monthAgo } };
        break;
      default:
        // allTime - no filter
        break;
    }

    const leaderboard = await User.find(dateFilter)
      .select('username firstName lastName profileImage totalPoints completedBeys isStudent')
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit));

    // Get additional stats for each user
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (user, index) => {
        const gamesPlayed = await PuzzleChallenge.countDocuments({ user: user._id });
        const puzzlesCompleted = await PuzzleChallenge.countDocuments({ 
          user: user._id, 
          status: 'completed' 
        });
        
        return {
          rank: index + 1,
          user: {
            _id: user._id,
            firstName: user.firstName || user.username,
            lastName: user.lastName || '',
            avatar: user.profileImage,
            isStudent: user.isStudent
          },
          score: user.totalPoints || 0,
          gamesPlayed,
          puzzlesCompleted
        };
      })
    );

    res.json({
      success: true,
      data: enrichedLeaderboard
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

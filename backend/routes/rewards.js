const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const UserReward = require('../models/UserReward');
const { protect } = require('../middleware/auth');

// @route   GET /api/rewards
// @desc    Get all available rewards
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, museum } = req.query;

    const query = { isActive: true };
    if (type) query.type = type;
    if (museum) query.museum = museum;

    const rewards = await Reward.find(query)
      .populate('bey', 'name')
      .populate('museum', 'name');

    res.json({
      success: true,
      count: rewards.length,
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

// @route   GET /api/rewards/:id
// @desc    Get single reward
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id)
      .populate('bey', 'name portraitImage')
      .populate('museum', 'name location');

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reward',
      error: error.message
    });
  }
});

// @route   POST /api/rewards/:id/redeem
// @desc    Redeem a user reward
// @access  Private
router.post('/:id/redeem', protect, async (req, res) => {
  try {
    const { location } = req.body;

    const userReward = await UserReward.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'available'
    }).populate('reward');

    if (!userReward) {
      return res.status(404).json({
        success: false,
        message: 'Available reward not found'
      });
    }

    // Check if expired
    if (userReward.expiresAt && new Date() > userReward.expiresAt) {
      userReward.status = 'expired';
      await userReward.save();
      return res.status(400).json({
        success: false,
        message: 'Reward has expired'
      });
    }

    // Mark as used
    userReward.status = 'used';
    userReward.usedAt = new Date();
    userReward.usedAt_location = location;
    await userReward.save();

    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        reward: userReward.reward,
        redemptionCode: userReward.redemptionCode,
        usedAt: userReward.usedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error redeeming reward',
      error: error.message
    });
  }
});

// @route   GET /api/rewards/verify/:code
// @desc    Verify a redemption code (for partners/museums)
// @access  Public (would be protected in production)
router.get('/verify/:code', async (req, res) => {
  try {
    const userReward = await UserReward.findOne({
      redemptionCode: req.params.code
    })
    .populate('user', 'username')
    .populate('reward');

    if (!userReward) {
      return res.status(404).json({
        success: false,
        message: 'Invalid redemption code'
      });
    }

    res.json({
      success: true,
      data: {
        valid: userReward.status === 'available',
        status: userReward.status,
        reward: {
          name: userReward.reward.name,
          type: userReward.reward.type,
          discount: userReward.reward.discountPercentage
        },
        user: userReward.user.username,
        earnedAt: userReward.earnedAt,
        expiresAt: userReward.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying code',
      error: error.message
    });
  }
});

module.exports = router;

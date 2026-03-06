const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const UserReward = require('../models/UserReward');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /rewards:
 *   get:
 *     summary: Get all available rewards
 *     tags: [Rewards]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [discount, free_entry, gift, badge, certificate]
 *         description: Filter by reward type
 *       - in: query
 *         name: museum
 *         schema:
 *           type: string
 *         description: Filter by museum ID
 *     responses:
 *       200:
 *         description: List of available rewards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reward'
 */
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

/**
 * @swagger
 * /rewards/{id}:
 *   get:
 *     summary: Get single reward details
 *     tags: [Rewards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reward ID
 *     responses:
 *       200:
 *         description: Reward details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /rewards/{id}/redeem:
 *   post:
 *     summary: Redeem a user reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserReward ID (not Reward ID)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
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
 *                     reward:
 *                       $ref: '#/components/schemas/Reward'
 *                     redemptionCode:
 *                       type: string
 *                     usedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Reward has expired
 *       404:
 *         description: Available reward not found
 */
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

/**
 * @swagger
 * /rewards/verify/{code}:
 *   get:
 *     summary: Verify a redemption code (for partners/museums)
 *     tags: [Rewards]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Redemption code to verify
 *         example: BEY-ABC123
 *     responses:
 *       200:
 *         description: Code verification result
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
 *                     valid:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                       enum: [available, used, expired]
 *                     reward:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         type:
 *                           type: string
 *                         discount:
 *                           type: number
 *                     user:
 *                       type: string
 *                     earnedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Invalid redemption code
 */
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

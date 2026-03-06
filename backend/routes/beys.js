const express = require('express');
const router = express.Router();
const Bey = require('../models/Bey');
const PuzzleChallenge = require('../models/PuzzleChallenge');
// Import models that are populated to ensure they're registered
require('../models/Currency');
require('../models/Dynasty');
require('../models/Museum');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /beys:
 *   get:
 *     summary: Get all beys
 *     tags: [Beys]
 *     parameters:
 *       - in: query
 *         name: dynasty
 *         schema:
 *           type: string
 *         description: Filter by dynasty ID
 *       - in: query
 *         name: museum
 *         schema:
 *           type: string
 *         description: Filter by primary museum ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of beys with pagination
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
 *                   type: object
 *                   properties:
 *                     beys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bey'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
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

/**
 * @swagger
 * /beys/timeline:
 *   get:
 *     summary: Get beys in timeline format
 *     tags: [Beys]
 *     responses:
 *       200:
 *         description: Timeline of all beys sorted by reign start
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       reignStart:
 *                         type: integer
 *                       reignEnd:
 *                         type: integer
 *                       dynasty:
 *                         $ref: '#/components/schemas/Dynasty'
 *                       portraitImage:
 *                         type: string
 *                       reignEndType:
 *                         type: string
 */
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

/**
 * @swagger
 * /beys/{id}:
 *   get:
 *     summary: Get single bey details
 *     tags: [Beys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bey ID
 *     responses:
 *       200:
 *         description: Full bey details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Bey'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /beys/{id}/puzzle-info:
 *   get:
 *     summary: Get puzzle information for a bey
 *     tags: [Beys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bey ID
 *     responses:
 *       200:
 *         description: Puzzle info (without revealing full image)
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
 *                     name:
 *                       type: string
 *                     puzzle:
 *                       type: object
 *                     pointsValue:
 *                       type: integer
 *                     reward:
 *                       type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         timesCompleted:
 *                           type: integer
 *                         averageTime:
 *                           type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /beys/{id}/user-progress:
 *   get:
 *     summary: Get user's progress on a specific bey puzzle
 *     tags: [Beys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bey ID
 *     responses:
 *       200:
 *         description: User's puzzle progress
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
 *                     hasStarted:
 *                       type: boolean
 *                     completed:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     piecesCollected:
 *                       type: integer
 *                     totalPieces:
 *                       type: integer
 *                     completionPercentage:
 *                       type: number
 *                     pointsEarned:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /beys/search/{query}:
 *   get:
 *     summary: Search beys by name
 *     tags: [Beys]
 *     parameters:
 *       - in: path
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: Hussein
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/Bey'
 */
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

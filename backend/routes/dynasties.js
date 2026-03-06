const express = require('express');
const router = express.Router();
const Dynasty = require('../models/Dynasty');
const Bey = require('../models/Bey');

/**
 * @swagger
 * /dynasties:
 *   get:
 *     summary: Get all dynasties
 *     tags: [Dynasties]
 *     responses:
 *       200:
 *         description: List of all dynasties with bey counts
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Dynasty'
 *                       - type: object
 *                         properties:
 *                           beyCount:
 *                             type: integer
 */
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

/**
 * @swagger
 * /dynasties/{id}:
 *   get:
 *     summary: Get single dynasty with its beys
 *     tags: [Dynasties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dynasty ID
 *     responses:
 *       200:
 *         description: Dynasty details with list of beys
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
 *                     dynasty:
 *                       $ref: '#/components/schemas/Dynasty'
 *                     beys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bey'
 *                     beyCount:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

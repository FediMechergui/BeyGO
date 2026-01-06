const mongoose = require('mongoose');

const puzzleChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bey',
    required: true
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  museum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum',
    required: true
  },
  // Challenge status
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'paused'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Puzzle pieces tracking (0-8 for 3x3 grid)
  totalPieces: {
    type: Number,
    default: 9
  },
  collectedPieces: [{
    pieceIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 8
    },
    collectedAt: {
      type: Date,
      default: Date.now
    },
    // AR collection location
    collectionLocation: {
      latitude: Number,
      longitude: Number,
      hotspotName: String
    }
  }],
  // Hints used
  hintsUsed: {
    type: Number,
    default: 0
  },
  maxHints: {
    type: Number,
    default: 3
  },
  // Points calculation
  basePoints: {
    type: Number,
    default: 100
  },
  bonusPoints: {
    type: Number,
    default: 0 // For speed, no hints, etc.
  },
  penaltyPoints: {
    type: Number,
    default: 0 // For hints used
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  // Completion time in seconds
  completionTime: {
    type: Number,
    default: null
  },
  // AR interaction data
  arInteractions: [{
    type: {
      type: String,
      enum: ['piece_found', 'hint_used', 'ar_view_opened', 'puzzle_assembled']
    },
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Virtual for pieces remaining
puzzleChallengeSchema.virtual('piecesRemaining').get(function() {
  return this.totalPieces - this.collectedPieces.length;
});

// Virtual for completion percentage
puzzleChallengeSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.collectedPieces.length / this.totalPieces) * 100);
});

// Method to collect a piece
puzzleChallengeSchema.methods.collectPiece = function(pieceIndex, location) {
  // Check if piece already collected
  const alreadyCollected = this.collectedPieces.some(p => p.pieceIndex === pieceIndex);
  if (alreadyCollected) {
    return { success: false, message: 'Piece already collected' };
  }

  // Add piece
  this.collectedPieces.push({
    pieceIndex,
    collectedAt: new Date(),
    collectionLocation: location
  });

  // Log AR interaction
  this.arInteractions.push({
    type: 'piece_found',
    data: { pieceIndex, location }
  });

  // Check if puzzle complete
  if (this.collectedPieces.length === this.totalPieces) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.completionTime = Math.round((this.completedAt - this.startedAt) / 1000);
    
    // Calculate total points
    this.bonusPoints = this.calculateBonusPoints();
    this.penaltyPoints = this.hintsUsed * 10;
    this.totalPoints = this.basePoints + this.bonusPoints - this.penaltyPoints;
  }

  return { 
    success: true, 
    piecesCollected: this.collectedPieces.length,
    isComplete: this.status === 'completed'
  };
};

// Calculate bonus points based on speed
puzzleChallengeSchema.methods.calculateBonusPoints = function() {
  if (!this.completionTime) return 0;
  
  const minutesTaken = this.completionTime / 60;
  
  if (minutesTaken < 10) return 50; // Speed bonus
  if (minutesTaken < 20) return 30;
  if (minutesTaken < 30) return 10;
  return 0;
};

// Method to use a hint
puzzleChallengeSchema.methods.useHint = function() {
  if (this.hintsUsed >= this.maxHints) {
    return { success: false, message: 'No hints remaining' };
  }
  
  this.hintsUsed++;
  this.arInteractions.push({
    type: 'hint_used',
    data: { hintNumber: this.hintsUsed }
  });
  
  // Find next uncollected piece
  const collectedIndices = this.collectedPieces.map(p => p.pieceIndex);
  const nextPiece = Array.from({ length: 9 }, (_, i) => i)
    .find(i => !collectedIndices.includes(i));
  
  return { 
    success: true, 
    hintsRemaining: this.maxHints - this.hintsUsed,
    hintPieceIndex: nextPiece
  };
};

module.exports = mongoose.model('PuzzleChallenge', puzzleChallengeSchema);

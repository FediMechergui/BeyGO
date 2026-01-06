const mongoose = require('mongoose');

const beySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bey name is required'],
    trim: true
  },
  fullTitle: {
    type: String,
    default: ''
  },
  reignDuration: {
    type: String,
    default: '' // e.g., "20 years"
  },
  reignStart: {
    type: Number,
    required: [true, 'Reign start year is required']
  },
  reignEnd: {
    type: Number,
    required: [true, 'Reign end year is required']
  },
  dynasty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dynasty',
    required: true
  },
  successionRelation: {
    wasSuccessor: {
      type: Boolean,
      default: false
    },
    relationDescription: {
      type: String,
      default: ''
    },
    predecessor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bey',
      default: null
    },
    successor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bey',
      default: null
    }
  },
  mainResidence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Residence'
  },
  mainCurrency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency'
  },
  bestEvents: [{
    type: String
  }],
  worstEvents: [{
    type: String
  }],
  primaryMuseum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum'
  },
  otherMuseums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum'
  }],
  // Puzzle configuration
  puzzle: {
    totalPieces: {
      type: Number,
      default: 9 // 3x3 grid
    },
    gridSize: {
      rows: { type: Number, default: 3 },
      cols: { type: Number, default: 3 }
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  // Rewards
  completionReward: {
    type: String,
    default: ''
  },
  pointsValue: {
    type: Number,
    default: 100
  },
  // How the reign ended
  reignEndMessage: {
    type: String,
    default: ''
  },
  reignEndType: {
    type: String,
    enum: ['natural_death', 'assassination', 'deposed', 'battle', 'exile', 'abdication', 'unknown'],
    default: 'unknown'
  },
  // Images
  portraitImage: {
    type: String,
    default: null
  },
  puzzleImage: {
    type: String,
    default: null // Full image that gets split into puzzle pieces
  },
  galleryImages: [{
    url: String,
    caption: String
  }],
  // Biography
  biography: {
    type: String,
    default: ''
  },
  funFacts: [{
    type: String
  }],
  // Stats
  timesCompleted: {
    type: Number,
    default: 0
  },
  averageCompletionTime: {
    type: Number,
    default: 0 // In minutes
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reign duration in years
beySchema.virtual('reignYears').get(function() {
  return this.reignEnd - this.reignStart;
});

// Virtual for historical events
beySchema.virtual('historicalEvents', {
  ref: 'HistoricalEvent',
  localField: '_id',
  foreignField: 'bey'
});

// Index for searching
beySchema.index({ name: 'text', biography: 'text' });

module.exports = mongoose.model('Bey', beySchema);

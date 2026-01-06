const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  museum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum',
    required: true
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  // Location verification
  locationVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['gps', 'qr_code', 'beacon', 'manual'],
    default: 'gps'
  },
  // Challenges during this visit
  challenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PuzzleChallenge'
  }],
  // Points earned during this visit
  pointsEarned: {
    type: Number,
    default: 0
  },
  // Duration tracking
  duration: {
    type: Number,
    default: 0 // In minutes
  },
  // User's path through museum (for analytics)
  pathHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  // Feedback
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate duration when visit ends
visitSchema.pre('save', function(next) {
  if (this.endDate && this.visitDate) {
    this.duration = Math.round((this.endDate - this.visitDate) / (1000 * 60)); // minutes
  }
  next();
});

module.exports = mongoose.model('Visit', visitSchema);

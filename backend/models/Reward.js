const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Reward name is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['discount', 'free_entry', 'merchandise', 'badge', 'achievement', 'points'],
    required: true
  },
  // For discounts
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  // Associated entities
  bey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bey',
    default: null
  },
  museum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum',
    default: null
  },
  // Partner information
  partner: {
    name: String,
    type: { 
      type: String, 
      enum: ['museum', 'cafe', 'shop', 'restaurant', 'tour'] 
    },
    address: String,
    contactInfo: String
  },
  // Validity
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null
  },
  usageLimit: {
    type: Number,
    default: 1 // How many times can be used
  },
  // Requirements
  pointsCost: {
    type: Number,
    default: 0 // Points needed to redeem
  },
  requiresCompletion: {
    type: Boolean,
    default: true // Must complete puzzle to get
  },
  // Visual
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#FFD700'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reward', rewardSchema);

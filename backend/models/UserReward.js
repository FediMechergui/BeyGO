const mongoose = require('mongoose');

const userRewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  // How it was earned
  earnedFrom: {
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PuzzleChallenge'
    },
    bey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bey'
    }
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  // Usage tracking
  status: {
    type: String,
    enum: ['available', 'used', 'expired'],
    default: 'available'
  },
  usedAt: {
    type: Date,
    default: null
  },
  usedAt_location: {
    type: String,
    default: null
  },
  // QR code for redemption
  redemptionCode: {
    type: String,
    unique: true,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique redemption code
userRewardSchema.pre('save', function(next) {
  if (!this.redemptionCode) {
    this.redemptionCode = `BEYGO-${this.user.toString().slice(-4)}-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('UserReward', userRewardSchema);

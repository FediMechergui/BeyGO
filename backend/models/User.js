const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  category: {
    type: String,
    enum: ['visitor', 'student'],
    default: 'visitor'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: String,
    default: null
  },
  studentIdVerifiedAt: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  completedBeys: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bey'
  }],
  achievements: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }],
  favoriteMuseums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Museum'
  }],
  lastLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    category: this.category,
    isVerified: this.isVerified,
    profileImage: this.profileImage,
    totalPoints: this.totalPoints,
    completedBeys: this.completedBeys,
    achievements: this.achievements,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

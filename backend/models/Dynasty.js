const mongoose = require('mongoose');

const dynastySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dynasty name is required'],
    unique: true,
    trim: true,
    enum: ['MOURADITE', 'HUSSEINITE']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  startYear: {
    type: Number,
    required: true
  },
  endYear: {
    type: Number,
    required: true
  },
  founder: {
    type: String,
    default: ''
  },
  capitalCity: {
    type: String,
    default: 'Tunis'
  },
  color: {
    type: String,
    default: '#000000' // For UI theming
  },
  icon: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all beys in this dynasty
dynastySchema.virtual('beys', {
  ref: 'Bey',
  localField: '_id',
  foreignField: 'dynasty'
});

// Virtual for dynasty duration
dynastySchema.virtual('duration').get(function() {
  return this.endYear - this.startYear;
});

module.exports = mongoose.model('Dynasty', dynastySchema);

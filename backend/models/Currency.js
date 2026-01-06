const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Currency name is required'],
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  period: {
    start: { type: Number, required: true },
    end: { type: Number, required: true }
  },
  description: {
    type: String,
    default: ''
  },
  material: {
    type: String,
    enum: ['gold', 'silver', 'copper', 'mixed'],
    default: 'mixed'
  },
  image: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Currency', currencySchema);

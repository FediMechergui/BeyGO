const mongoose = require('mongoose');

const historicalEventSchema = new mongoose.Schema({
  bey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bey',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  category: {
    type: String,
    enum: ['best', 'worst', 'military', 'diplomatic', 'economic', 'cultural', 'political'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  endYear: {
    type: Number,
    default: null // For events spanning multiple years
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  sources: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('HistoricalEvent', historicalEventSchema);

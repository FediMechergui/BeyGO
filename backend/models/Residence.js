const mongoose = require('mongoose');

const residenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Residence name is required'],
    trim: true
  },
  location: {
    address: String,
    city: { type: String, default: 'Tunis' },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['exists', 'ruins', 'destroyed', 'museum', 'unesco'],
    default: 'exists'
  },
  description: {
    type: String,
    default: ''
  },
  builtYear: {
    type: Number,
    default: null
  },
  images: [{
    url: String,
    caption: String
  }],
  isVisitable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Residence', residenceSchema);

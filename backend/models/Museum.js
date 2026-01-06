const mongoose = require('mongoose');

const museumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Museum name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      default: 'Tunis'
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    // Geofencing radius in meters
    radius: {
      type: Number,
      default: 100
    }
  },
  focus: {
    type: String,
    default: 'General History'
  },
  isUNESCO: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String
  }],
  openingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  entryFee: {
    regular: { type: Number, default: 0 },
    student: { type: Number, default: 0 },
    currency: { type: String, default: 'TND' }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'cafe', 'gift_shop', 'parking', 'wheelchair_access', 'guided_tours', 'audio_guide']
  }],
  // AR Hotspots within the museum for puzzle pieces
  arHotspots: [{
    name: String,
    description: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    floor: { type: Number, default: 0 },
    puzzlePieceIndex: Number // Which piece (0-8) can be found here
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  totalVisits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all beys associated with this museum
museumSchema.virtual('beys', {
  ref: 'Bey',
  localField: '_id',
  foreignField: 'primaryMuseum'
});

// Index for faster queries
museumSchema.index({ isActive: 1 });

// Method to check if user is within museum radius
museumSchema.methods.isUserInRange = function(userLat, userLng) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = this.location.coordinates.latitude * Math.PI / 180;
  const φ2 = userLat * Math.PI / 180;
  const Δφ = (userLat - this.location.coordinates.latitude) * Math.PI / 180;
  const Δλ = (userLng - this.location.coordinates.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // Distance in meters

  return distance <= this.location.radius;
};

module.exports = mongoose.model('Museum', museumSchema);

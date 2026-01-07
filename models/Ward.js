const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  ward_name: {
    type: String,
    required: [true, 'Ward name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Ward name cannot exceed 100 characters']
  },
  district: {
    type: String,
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  province: {
    type: String,
    trim: true,
    maxlength: [100, 'Province name cannot exceed 100 characters']
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'],
      required: [true, 'Geometry type is required']
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Geometry coordinates are required']
    }
  },
  // Flood risk assessment parameters
  population_density: {
    type: Number,
    min: [0, 'Population density cannot be negative'],
    default: 0
  },
  rainfall: {
    type: Number,
    min: [0, 'Rainfall cannot be negative'],
    default: 0
  },
  low_elevation: {
    type: Number,
    min: [0, 'Low elevation cannot be negative'],
    default: 0
  },
  urban_land: {
    type: Number,
    min: [0, 'Urban land percentage cannot be negative'],
    max: [100, 'Urban land percentage cannot exceed 100%'],
    default: 0
  },
  drainage_capacity: {
    type: Number,
    min: [0, 'Drainage capacity cannot be negative'],
    default: 0
  },

  // Calculated risk indicators
  flood_risk: {
    type: Number,
    min: [0, 'Flood risk cannot be negative'],
    max: [10, 'Flood risk cannot exceed 10'],
    default: 0
  },
  risk_level: {
    type: String,
    enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
    default: 'Low'
  },
  exposure: {
    type: Number,
    min: [0, 'Exposure cannot be negative'],
    max: [10, 'Exposure cannot exceed 10'],
    default: 0
  },
  susceptibility: {
    type: Number,
    min: [0, 'Susceptibility cannot be negative'],
    max: [10, 'Susceptibility cannot exceed 10'],
    default: 0
  },
  resilience: {
    type: Number,
    min: [0, 'Resilience cannot be negative'],
    max: [10, 'Resilience cannot exceed 10'],
    default: 0
  },

  // Additional metadata
  area_km2: {
    type: Number,
    min: [0, 'Area cannot be negative']
  },
  population: {
    type: Number,
    min: [0, 'Population cannot be negative'],
    default: 0
  },
  infrastructure_count: {
    roads: { type: Number, default: 0 },
    bridges: { type: Number, default: 0 },
    drainage_systems: { type: Number, default: 0 }
  },

  // Status and timestamps
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
wardSchema.index({ ward_name: 1 });
wardSchema.index({ district: 1 });
wardSchema.index({ flood_risk: -1 });
wardSchema.index({ risk_level: 1 });
wardSchema.index({ geometry: '2dsphere' }); // For geospatial queries

// Virtual for formatted risk level
wardSchema.virtual('riskLevelFormatted').get(function () {
  const levels = {
    'Very Low': 'Rất Thấp',
    'Low': 'Thấp',
    'Medium': 'Trung Bình',
    'High': 'Cao',
    'Very High': 'Rất Cao'
  };
  return levels[this.risk_level] || this.risk_level;
});

// Method to calculate flood risk based on parameters
wardSchema.methods.calculateFloodRisk = function () {
  // Simple risk calculation algorithm
  // This can be enhanced with more sophisticated formulas
  const exposureScore = (this.population_density / 10000) * 3 +
    (this.urban_land / 100) * 2 +
    (this.low_elevation / 10) * 2.5;

  const susceptibilityScore = (this.rainfall / 300) * 3 +
    (10 - this.drainage_capacity) * 0.5;

  const resilienceScore = this.drainage_capacity * 0.3 +
    (10 - this.low_elevation) * 0.2;

  this.exposure = Math.min(exposureScore, 10);
  this.susceptibility = Math.min(susceptibilityScore, 10);
  this.resilience = Math.min(resilienceScore, 10);

  // Overall flood risk (weighted average)
  this.flood_risk = (this.exposure * 0.4 + this.susceptibility * 0.4 - this.resilience * 0.2);
  this.flood_risk = Math.max(0, Math.min(10, this.flood_risk));

  // Determine risk level
  if (this.flood_risk >= 8) this.risk_level = 'Very High';
  else if (this.flood_risk >= 6) this.risk_level = 'High';
  else if (this.flood_risk >= 4) this.risk_level = 'Medium';
  else if (this.flood_risk >= 2) this.risk_level = 'Low';
  else this.risk_level = 'Very Low';

  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get wards by risk level
wardSchema.statics.getByRiskLevel = function (level) {
  return this.find({ risk_level: level, isActive: true });
};

// Static method to get statistics
wardSchema.statics.getStatistics = function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalWards: { $sum: 1 },
        avgRisk: { $avg: '$flood_risk' },
        maxRisk: { $max: '$flood_risk' },
        avgRainfall: { $avg: '$rainfall' },
        avgElevation: { $avg: '$low_elevation' },
        avgDrainage: { $avg: '$drainage_capacity' },
        totalPopulation: { $sum: '$population' }
      }
    }
  ]);
};

module.exports = mongoose.model('Ward', wardSchema);
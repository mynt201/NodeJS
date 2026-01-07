const mongoose = require('mongoose');

const roadBridgeDataSchema = new mongoose.Schema({
  ward_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: [true, 'Ward ID is required']
  },

  // Basic information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['road', 'bridge', 'culvert', 'tunnel', 'highway', 'street', 'boulevard'],
    default: 'road'
  },

  // Location and geometry
  coordinates: {
    start_latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    start_longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    end_latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    end_longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon']
    },
    coordinates: mongoose.Schema.Types.Mixed
  },

  // Physical characteristics
  length: {
    type: Number,
    min: [0, 'Length cannot be negative']
  }, // in meters
  width: {
    type: Number,
    min: [0, 'Width cannot be negative']
  }, // in meters
  lanes: {
    type: Number,
    min: [1, 'Must have at least 1 lane'],
    max: [10, 'Cannot have more than 10 lanes']
  },
  surface_type: {
    type: String,
    enum: ['asphalt', 'concrete', 'gravel', 'dirt', 'brick', 'stone'],
    default: 'asphalt'
  },

  // Flood vulnerability
  flood_level: {
    type: Number,
    required: [true, 'Flood level is required'],
    min: [0, 'Flood level cannot be negative'],
    max: [10, 'Flood level cannot exceed 10'],
    default: 0
  },
  elevation_above_sea_level: {
    type: Number,
    min: [0, 'Elevation cannot be negative']
  }, // in meters
  flood_history: [{
    date: {
      type: Date,
      required: true
    },
    flood_depth: {
      type: Number,
      min: [0, 'Flood depth cannot be negative']
    },
    duration_hours: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    impact: {
      type: String,
      enum: ['none', 'minor', 'moderate', 'severe', 'critical'],
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  }],

  // Structural information (for bridges and culverts)
  structural_data: {
    material: {
      type: String,
      enum: ['concrete', 'steel', 'wood', 'stone', 'composite']
    },
    construction_year: {
      type: Number,
      min: [1800, 'Construction year seems invalid'],
      max: [new Date().getFullYear() + 5, 'Construction year cannot be in the future']
    },
    design_load: {
      type: String,
      enum: ['light', 'medium', 'heavy', 'extra_heavy']
    },
    span_count: {
      type: Number,
      min: [1, 'Must have at least 1 span']
    },
    max_span_length: {
      type: Number,
      min: [0, 'Span length cannot be negative']
    }
  },

  // Condition assessment
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
    default: 'good'
  },
  condition_score: {
    type: Number,
    min: [1, 'Condition score must be between 1-5'],
    max: [5, 'Condition score must be between 1-5'],
    default: 3
  },
  last_inspection_date: {
    type: Date
  },
  next_inspection_date: {
    type: Date
  },

  // Traffic and usage
  traffic_volume: {
    daily_average: {
      type: Number,
      min: [0, 'Traffic volume cannot be negative']
    },
    peak_hour: {
      type: Number,
      min: [0, 'Peak hour traffic cannot be negative']
    }
  },
  usage_restrictions: [{
    type: String,
    enum: ['weight_limit', 'height_limit', 'width_limit', 'emergency_only', 'seasonal_closure']
  }],

  // Maintenance history
  maintenance_history: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['repair', 'replacement', 'inspection', 'painting', 'reinforcement', 'cleaning'],
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative']
    },
    contractor: {
      type: String,
      maxlength: [100, 'Contractor name cannot exceed 100 characters']
    }
  }],

  // Status and operational data
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'closed', 'under_construction', 'damaged'],
    default: 'operational'
  },
  criticality_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Financial information
  estimated_value: {
    type: Number,
    min: [0, 'Estimated value cannot be negative']
  },
  annual_maintenance_cost: {
    type: Number,
    min: [0, 'Annual maintenance cost cannot be negative']
  },

  // Metadata
  data_source: {
    type: String,
    enum: ['survey', 'gis', 'manual_entry', 'inspection_report'],
    default: 'manual_entry'
  },
  verified: {
    type: Boolean,
    default: false
  },
  verified_date: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
roadBridgeDataSchema.index({ ward_id: 1 });
roadBridgeDataSchema.index({ type: 1 });
roadBridgeDataSchema.index({ condition: 1 });
roadBridgeDataSchema.index({ status: 1 });
roadBridgeDataSchema.index({ flood_level: -1 });
roadBridgeDataSchema.index({ criticality_level: 1 });
roadBridgeDataSchema.index({ geometry: '2dsphere' }); // For geospatial queries

// Virtual for formatted condition
roadBridgeDataSchema.virtual('conditionFormatted').get(function () {
  const conditions = {
    'excellent': 'Xuất sắc',
    'good': 'Tốt',
    'fair': 'Trung bình',
    'poor': 'Kém',
    'critical': 'Nguy hiểm'
  };
  return conditions[this.condition] || this.condition;
});

// Virtual for formatted type
roadBridgeDataSchema.virtual('typeFormatted').get(function () {
  const types = {
    'road': 'Đường',
    'bridge': 'Cầu',
    'culvert': 'Cống máng',
    'tunnel': 'Đường hầm',
    'highway': 'Đại lộ',
    'street': 'Đường phố',
    'boulevard': 'Đại lộ'
  };
  return types[this.type] || this.type;
});

// Method to check if inspection is overdue
roadBridgeDataSchema.methods.isInspectionOverdue = function () {
  if (!this.next_inspection_date) return false;
  return new Date() > this.next_inspection_date;
};

// Method to calculate flood vulnerability score
roadBridgeDataSchema.methods.calculateFloodVulnerability = function () {
  let score = 0;

  // Base score from flood level
  score += this.flood_level * 2;

  // Adjust based on elevation
  if (this.elevation_above_sea_level < 5) score += 2;
  else if (this.elevation_above_sea_level < 10) score += 1;

  // Adjust based on criticality
  const criticalityMultiplier = {
    'low': 0.5,
    'medium': 1,
    'high': 1.5,
    'critical': 2
  };
  score *= criticalityMultiplier[this.criticality_level] || 1;

  return Math.min(10, Math.max(0, score));
};

// Static method to get infrastructure by ward
roadBridgeDataSchema.statics.getByWard = function (wardId) {
  return this.find({ ward_id: wardId, status: { $ne: 'closed' } });
};

// Static method to get high-risk infrastructure
roadBridgeDataSchema.statics.getHighRiskInfrastructure = function () {
  return this.find({
    $or: [
      { flood_level: { $gte: 7 } },
      { condition: 'critical' },
      { criticality_level: 'critical' }
    ],
    status: 'operational'
  });
};

// Static method to get infrastructure needing inspection
roadBridgeDataSchema.statics.getNeedingInspection = function () {
  const now = new Date();
  return this.find({
    next_inspection_date: { $lte: now },
    status: 'operational'
  });
};

module.exports = mongoose.model('RoadBridgeData', roadBridgeDataSchema);
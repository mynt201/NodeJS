const mongoose = require('mongoose');

const drainageDataSchema = new mongoose.Schema({
  ward_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: [true, 'Ward ID is required']
  },

  // Basic information
  name: {
    type: String,
    required: [true, 'Drainage system name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Drainage system type is required'],
    enum: ['canal', 'drain', 'culvert', 'pump_station', 'retention_basin', 'sewer_system', 'open_drain', 'underground_pipe'],
    default: 'drain'
  },

  // Location and geometry
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
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
  depth: {
    type: Number,
    min: [0, 'Depth cannot be negative']
  }, // in meters
  diameter: {
    type: Number,
    min: [0, 'Diameter cannot be negative']
  }, // in meters (for pipes)

  // Capacity and performance
  design_capacity: {
    type: Number,
    min: [0, 'Design capacity cannot be negative']
  }, // cubic meters per second
  current_capacity: {
    type: Number,
    min: [0, 'Current capacity cannot be negative']
  }, // cubic meters per second
  efficiency_percentage: {
    type: Number,
    min: [0, 'Efficiency cannot be below 0%'],
    max: [100, 'Efficiency cannot exceed 100%']
  },

  // Condition assessment
  condition: {
    type: String,
    required: [true, 'Condition is required'],
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
  next_maintenance_date: {
    type: Date
  },

  // Maintenance history
  maintenance_history: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['cleaning', 'repair', 'replacement', 'inspection', 'upgrade'],
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
    performed_by: {
      type: String,
      maxlength: [100, 'Performed by cannot exceed 100 characters']
    }
  }],

  // Operational status
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'out_of_service', 'under_construction'],
    default: 'operational'
  },
  is_automated: {
    type: Boolean,
    default: false
  },

  // Environmental impact
  environmental_impact: {
    water_quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    sediment_accumulation: {
      type: Number,
      min: [0, 'Sediment accumulation cannot be negative']
    }, // percentage
    pollution_level: {
      type: String,
      enum: ['none', 'low', 'moderate', 'high', 'severe']
    }
  },

  // Financial information
  construction_year: {
    type: Number,
    min: [1800, 'Construction year seems invalid'],
    max: [new Date().getFullYear() + 5, 'Construction year cannot be in the future']
  },
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
    enum: ['survey', 'gis', 'manual_entry', 'sensor'],
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
drainageDataSchema.index({ ward_id: 1 });
drainageDataSchema.index({ type: 1 });
drainageDataSchema.index({ condition: 1 });
drainageDataSchema.index({ status: 1 });
drainageDataSchema.index({ geometry: '2dsphere' }); // For geospatial queries

// Virtual for formatted condition
drainageDataSchema.virtual('conditionFormatted').get(function () {
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
drainageDataSchema.virtual('typeFormatted').get(function () {
  const types = {
    'canal': 'Kênh mương',
    'drain': 'Cống thoát nước',
    'culvert': 'Cống máng',
    'pump_station': 'Trạm bơm',
    'retention_basin': 'Bể giữ nước',
    'sewer_system': 'Hệ thống cống',
    'open_drain': 'Mương hở',
    'underground_pipe': 'Ống ngầm'
  };
  return types[this.type] || this.type;
});

// Method to check if maintenance is overdue
drainageDataSchema.methods.isMaintenanceOverdue = function () {
  if (!this.next_maintenance_date) return false;
  return new Date() > this.next_maintenance_date;
};

// Method to calculate efficiency score
drainageDataSchema.methods.calculateEfficiencyScore = function () {
  if (!this.design_capacity || !this.current_capacity) return 0;
  return (this.current_capacity / this.design_capacity) * 100;
};

// Static method to get drainage systems by ward
drainageDataSchema.statics.getByWard = function (wardId) {
  return this.find({ ward_id: wardId, status: 'operational' });
};

// Static method to get systems needing maintenance
drainageDataSchema.statics.getNeedingMaintenance = function () {
  const now = new Date();
  return this.find({
    next_maintenance_date: { $lte: now },
    status: 'operational'
  });
};

// Static method to get condition summary by ward
drainageDataSchema.statics.getConditionSummaryByWard = function (wardId) {
  return this.aggregate([
    { $match: { ward_id: mongoose.Types.ObjectId(wardId) } },
    {
      $group: {
        _id: '$condition',
        count: { $sum: 1 },
        avgEfficiency: { $avg: '$efficiency_percentage' }
      }
    }
  ]);
};

module.exports = mongoose.model('DrainageData', drainageDataSchema);
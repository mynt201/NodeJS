const mongoose = require('mongoose');

const riskIndexDataSchema = new mongoose.Schema({
  ward_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: [true, 'Ward ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },

  // Risk index scores (0-10 scale)
  risk_index: {
    type: Number,
    required: [true, 'Risk index is required'],
    min: [0, 'Risk index cannot be negative'],
    max: [10, 'Risk index cannot exceed 10']
  },
  exposure: {
    type: Number,
    required: [true, 'Exposure is required'],
    min: [0, 'Exposure cannot be negative'],
    max: [10, 'Exposure cannot exceed 10']
  },
  susceptibility: {
    type: Number,
    required: [true, 'Susceptibility is required'],
    min: [0, 'Susceptibility cannot be negative'],
    max: [10, 'Susceptibility cannot exceed 10']
  },
  resilience: {
    type: Number,
    required: [true, 'Resilience is required'],
    min: [0, 'Resilience cannot be negative'],
    max: [10, 'Resilience cannot exceed 10']
  },

  // Component breakdown for exposure
  exposure_components: {
    population_density: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.3 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    urban_land_use: {
      value: { type: Number, min: 0, max: 100 },
      weight: { type: Number, min: 0, max: 1, default: 0.25 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    elevation: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.25 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    proximity_to_water: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.2 },
      contribution: { type: Number, min: 0, max: 10 }
    }
  },

  // Component breakdown for susceptibility
  susceptibility_components: {
    rainfall_intensity: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.4 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    soil_type: {
      value: { type: String, enum: ['clay', 'silt', 'sand', 'gravel', 'rock'] },
      permeability: { type: Number, min: 0, max: 1 },
      weight: { type: Number, min: 0, max: 1, default: 0.2 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    slope: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.2 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    drainage_capacity: {
      value: { type: Number, min: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.2 },
      contribution: { type: Number, min: 0, max: 10 }
    }
  },

  // Component breakdown for resilience
  resilience_components: {
    drainage_systems: {
      count: { type: Number, min: 0, default: 0 },
      efficiency: { type: Number, min: 0, max: 100 },
      weight: { type: Number, min: 0, max: 1, default: 0.3 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    infrastructure: {
      flood_defenses: { type: Number, min: 0, default: 0 },
      elevated_structures: { type: Number, min: 0, default: 0 },
      weight: { type: Number, min: 0, max: 1, default: 0.25 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    emergency_services: {
      response_time: { type: Number, min: 0 }, // minutes
      capacity: { type: Number, min: 0, max: 100 },
      weight: { type: Number, min: 0, max: 1, default: 0.25 },
      contribution: { type: Number, min: 0, max: 10 }
    },
    community_preparedness: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, min: 0, max: 1, default: 0.2 },
      contribution: { type: Number, min: 0, max: 10 }
    }
  },

  // Risk categorization
  risk_category: {
    type: String,
    enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
    required: true
  },
  risk_trend: {
    type: String,
    enum: ['increasing', 'stable', 'decreasing'],
    default: 'stable'
  },

  // Temporal analysis
  compared_to_previous: {
    period: {
      type: String,
      enum: ['day', 'week', 'month', 'year']
    },
    change_percentage: { type: Number },
    change_amount: { type: Number }
  },

  // External factors
  external_factors: {
    weather_warnings: [{
      type: {
        type: String,
        enum: ['flood', 'heavy_rain', 'storm', 'typhoon']
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'extreme']
      },
      expected_impact: { type: Number, min: 0, max: 10 }
    }],
    upstream_conditions: {
      dam_release: { type: Boolean, default: false },
      upstream_rainfall: { type: Number, min: 0 }
    }
  },

  // Data quality and confidence
  confidence_level: {
    type: Number,
    min: [0, 'Confidence level must be between 0-100'],
    max: [100, 'Confidence level must be between 0-100'],
    default: 85
  },
  data_completeness: {
    type: Number,
    min: [0, 'Data completeness must be between 0-100'],
    max: [100, 'Data completeness must be between 0-100'],
    default: 100
  },

  // Calculation metadata
  calculation_method: {
    type: String,
    enum: ['automated', 'manual', 'hybrid'],
    default: 'automated'
  },
  calculation_version: {
    type: String,
    default: '1.0'
  },
  input_data_sources: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['weather', 'sensor', 'survey', 'satellite', 'manual']
    },
    reliability: {
      type: Number,
      min: 0,
      max: 100
    }
  }],

  // Validation and review
  validated: {
    type: Boolean,
    default: false
  },
  validated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validated_date: {
    type: Date
  },
  review_notes: {
    type: String,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },

  // Metadata
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
riskIndexDataSchema.index({ ward_id: 1, date: -1 });
riskIndexDataSchema.index({ risk_category: 1 });
riskIndexDataSchema.index({ risk_index: -1 });
riskIndexDataSchema.index({ date: -1 });

// Virtual for risk level color mapping
riskIndexDataSchema.virtual('riskColor').get(function () {
  const colors = {
    'Very Low': '#00FF00', // Green
    'Low': '#90EE90', // Light Green
    'Medium': '#FFFF00', // Yellow
    'High': '#FFA500', // Orange
    'Very High': '#FF0000' // Red
  };
  return colors[this.risk_category] || '#808080';
});

// Method to recalculate risk index
riskIndexDataSchema.methods.recalculateRiskIndex = function () {
  // Recalculate exposure
  this.exposure = 0;
  Object.values(this.exposure_components).forEach(component => {
    if (component.contribution !== undefined) {
      this.exposure += component.contribution * (component.weight || 1);
    }
  });

  // Recalculate susceptibility
  this.susceptibility = 0;
  Object.values(this.susceptibility_components).forEach(component => {
    if (component.contribution !== undefined) {
      this.susceptibility += component.contribution * (component.weight || 1);
    }
  });

  // Recalculate resilience
  this.resilience = 0;
  Object.values(this.resilience_components).forEach(component => {
    if (component.contribution !== undefined) {
      this.resilience += component.contribution * (component.weight || 1);
    }
  });

  // Overall risk index (weighted formula)
  this.risk_index = (this.exposure * 0.4 + this.susceptibility * 0.4 - this.resilience * 0.2);
  this.risk_index = Math.max(0, Math.min(10, this.risk_index));

  // Update risk category
  this.updateRiskCategory();

  return this.save();
};

// Method to update risk category based on risk index
riskIndexDataSchema.methods.updateRiskCategory = function () {
  if (this.risk_index >= 8) this.risk_category = 'Very High';
  else if (this.risk_index >= 6) this.risk_category = 'High';
  else if (this.risk_index >= 4) this.risk_category = 'Medium';
  else if (this.risk_index >= 2) this.risk_category = 'Low';
  else this.risk_category = 'Very Low';
};

// Static method to get risk data for a ward within date range
riskIndexDataSchema.statics.getWardRiskHistory = function (wardId, startDate, endDate) {
  return this.find({
    ward_id: wardId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get current risk levels for all wards
riskIndexDataSchema.statics.getCurrentRiskLevels = function () {
  return this.aggregate([{
    $sort: { ward_id: 1, date: -1 }
  },
  {
    $group: {
      _id: '$ward_id',
      latestData: { $first: '$$ROOT' }
    }
  },
  {
    $lookup: {
      from: 'wards',
      localField: '_id',
      foreignField: '_id',
      as: 'ward'
    }
  },
  {
    $unwind: '$ward'
  },
  {
    $project: {
      ward_name: '$ward.ward_name',
      risk_index: '$latestData.risk_index',
      risk_category: '$latestData.risk_category',
      exposure: '$latestData.exposure',
      susceptibility: '$latestData.susceptibility',
      resilience: '$latestData.resilience',
      date: '$latestData.date'
    }
  }
  ]);
};

// Static method to get risk trend analysis
riskIndexDataSchema.statics.getRiskTrendAnalysis = function (wardId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([{
    $match: {
      ward_id: mongoose.Types.ObjectId(wardId),
      date: { $gte: startDate }
    }
  },
  {
    $sort: { date: 1 }
  },
  {
    $group: {
      _id: null,
      data: {
        $push: {
          date: '$date',
          risk_index: '$risk_index',
          exposure: '$exposure',
          susceptibility: '$susceptibility',
          resilience: '$resilience'
        }
      },
      avg_risk: { $avg: '$risk_index' },
      max_risk: { $max: '$risk_index' },
      min_risk: { $min: '$risk_index' }
    }
  }
  ]);
};

module.exports = mongoose.model('RiskIndexData', riskIndexDataSchema);
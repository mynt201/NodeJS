const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
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

  // Temperature data (°C)
  temperature: {
    current: {
      type: Number,
      min: [-50, 'Temperature cannot be below -50°C'],
      max: [60, 'Temperature cannot exceed 60°C']
    },
    min: {
      type: Number,
      min: [-50, 'Minimum temperature cannot be below -50°C'],
      max: [60, 'Minimum temperature cannot exceed 60°C']
    },
    max: {
      type: Number,
      min: [-50, 'Maximum temperature cannot be below -50°C'],
      max: [60, 'Maximum temperature cannot exceed 60°C']
    },
    feels_like: {
      type: Number,
      min: [-50, 'Feels like temperature cannot be below -50°C'],
      max: [60, 'Feels like temperature cannot exceed 60°C']
    }
  },

  // Humidity (%)
  humidity: {
    type: Number,
    required: [true, 'Humidity is required'],
    min: [0, 'Humidity cannot be below 0%'],
    max: [100, 'Humidity cannot exceed 100%']
  },

  // Rainfall (mm)
  rainfall: {
    type: Number,
    required: [true, 'Rainfall is required'],
    min: [0, 'Rainfall cannot be negative'],
    default: 0
  },

  // Wind data
  wind_speed: {
    type: Number,
    min: [0, 'Wind speed cannot be negative'],
    default: 0
  },
  wind_direction: {
    type: Number,
    min: [0, 'Wind direction must be between 0-360 degrees'],
    max: [360, 'Wind direction must be between 0-360 degrees']
  },
  wind_gust: {
    type: Number,
    min: [0, 'Wind gust cannot be negative']
  },

  // Pressure (hPa)
  pressure: {
    type: Number,
    min: [800, 'Pressure cannot be below 800 hPa'],
    max: [1200, 'Pressure cannot exceed 1200 hPa']
  },

  // Visibility (km)
  visibility: {
    type: Number,
    min: [0, 'Visibility cannot be negative']
  },

  // Weather conditions
  weather_condition: {
    main: {
      type: String,
      enum: ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'],
      default: 'Clear'
    },
    description: {
      type: String,
      maxlength: [200, 'Weather description cannot exceed 200 characters']
    },
    icon: {
      type: String,
      maxlength: [10, 'Weather icon code cannot exceed 10 characters']
    }
  },

  // UV Index
  uv_index: {
    type: Number,
    min: [0, 'UV index cannot be negative'],
    max: [11, 'UV index cannot exceed 11']
  },

  // Air Quality Index (if available)
  aqi: {
    type: Number,
    min: [0, 'AQI cannot be negative'],
    max: [500, 'AQI cannot exceed 500']
  },

  // Data source information
  data_source: {
    type: String,
    enum: ['weather_api', 'manual', 'sensor', 'forecast'],
    default: 'weather_api'
  },
  source_id: {
    type: String,
    trim: true
  },

  // Quality indicators
  is_forecast: {
    type: Boolean,
    default: false
  },
  confidence_level: {
    type: Number,
    min: [0, 'Confidence level must be between 0-100'],
    max: [100, 'Confidence level must be between 0-100'],
    default: 100
  },

  // Metadata
  recorded_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
weatherDataSchema.index({ ward_id: 1, date: -1 });
weatherDataSchema.index({ date: -1 });
weatherDataSchema.index({ 'weather_condition.main': 1 });
weatherDataSchema.index({ rainfall: -1 });

// Virtual for formatted wind direction
weatherDataSchema.virtual('windDirectionCardinal').get(function () {
  if (!this.wind_direction) return null;

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(this.wind_direction / 22.5) % 16;
  return directions[index];
});

// Method to check if data is recent (within last 24 hours)
weatherDataSchema.methods.isRecent = function () {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.recorded_at > twentyFourHoursAgo;
};

// Static method to get weather data for a ward within date range
weatherDataSchema.statics.getWardWeatherInRange = function (wardId, startDate, endDate) {
  return this.find({
    ward_id: wardId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get average rainfall for a ward in a period
weatherDataSchema.statics.getAverageRainfall = function (wardId, startDate, endDate) {
  return this.aggregate([{
    $match: {
      ward_id: mongoose.Types.ObjectId(wardId),
      date: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: null,
      averageRainfall: { $avg: '$rainfall' },
      totalRainfall: { $sum: '$rainfall' },
      days: { $sum: 1 },
      maxRainfall: { $max: '$rainfall' }
    }
  }
  ]);
};

// Static method to get latest weather data for all wards
weatherDataSchema.statics.getLatestForAllWards = function () {
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
    $replaceRoot: { newRoot: '$latestData' }
  }
  ]);
};

module.exports = mongoose.model('WeatherData', weatherDataSchema);
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },

  // Theme preferences
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'dark'
  },

  // Language preferences
  language: {
    type: String,
    enum: ['vi', 'en'],
    default: 'vi'
  },

  // Dashboard preferences
  dashboard: {
    defaultView: {
      type: String,
      enum: ['map', 'dashboard', 'analytics'],
      default: 'dashboard'
    },
    refreshInterval: {
      type: Number,
      min: [30, 'Refresh interval must be at least 30 seconds'],
      max: [3600, 'Refresh interval cannot exceed 1 hour'],
      default: 300 // 5 minutes
    },
    showNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Risk assessment preferences
  riskThresholds: {
    veryLow: {
      type: Number,
      min: 0,
      max: 10,
      default: 2
    },
    low: {
      type: Number,
      min: 0,
      max: 10,
      default: 4
    },
    medium: {
      type: Number,
      min: 0,
      max: 10,
      default: 6
    },
    high: {
      type: Number,
      min: 0,
      max: 10,
      default: 8
    },
    veryHigh: {
      type: Number,
      min: 0,
      max: 10,
      default: 9
    }
  },

  // Notification preferences
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      types: {
        floodAlerts: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true },
        reportReady: { type: Boolean, default: true },
        maintenanceDue: { type: Boolean, default: true }
      }
    },
    browser: {
      enabled: { type: Boolean, default: true },
      types: {
        floodAlerts: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: false },
        reportReady: { type: Boolean, default: true },
        maintenanceDue: { type: Boolean, default: true }
      }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      types: {
        floodAlerts: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: false },
        reportReady: { type: Boolean, default: false },
        maintenanceDue: { type: Boolean, default: false }
      }
    }
  },

  // Privacy settings
  privacy: {
    shareAnalytics: { type: Boolean, default: false },
    allowDataCollection: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: false }
  },

  // Accessibility settings
  accessibility: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    highContrast: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for better performance
settingsSchema.index({ user_id: 1 });
settingsSchema.index({ 'theme': 1 });
settingsSchema.index({ 'language': 1 });

// Static method to create default settings
settingsSchema.statics.createDefaultSettings = async function(userId) {
  const defaultSettings = new this({
    user_id: userId,
    theme: 'dark',
    language: 'vi',
    dashboard: {
      defaultView: 'dashboard',
      refreshInterval: 300,
      showNotifications: true
    },
    riskThresholds: {
      veryLow: 2,
      low: 4,
      medium: 6,
      high: 8,
      veryHigh: 9
    },
    notifications: {
      email: {
        enabled: true,
        types: {
          floodAlerts: true,
          systemUpdates: true,
          reportReady: true,
          maintenanceDue: true
        }
      },
      browser: {
        enabled: true,
        types: {
          floodAlerts: true,
          systemUpdates: false,
          reportReady: true,
          maintenanceDue: true
        }
      },
      sms: {
        enabled: false,
        types: {
          floodAlerts: true,
          systemUpdates: false,
          reportReady: false,
          maintenanceDue: false
        }
      }
    },
    privacy: {
      shareAnalytics: false,
      allowDataCollection: true,
      publicProfile: false
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false
    }
  });

  return await defaultSettings.save();
};

// Method to reset settings to defaults
settingsSchema.methods.resetToDefaults = async function() {
  const defaults = {
    theme: 'dark',
    language: 'vi',
    dashboard: {
      defaultView: 'dashboard',
      refreshInterval: 300,
      showNotifications: true
    },
    riskThresholds: {
      veryLow: 2,
      low: 4,
      medium: 6,
      high: 8,
      veryHigh: 9
    },
    notifications: {
      email: {
        enabled: true,
        types: {
          floodAlerts: true,
          systemUpdates: true,
          reportReady: true,
          maintenanceDue: true
        }
      },
      browser: {
        enabled: true,
        types: {
          floodAlerts: true,
          systemUpdates: false,
          reportReady: true,
          maintenanceDue: true
        }
      },
      sms: {
        enabled: false,
        types: {
          floodAlerts: true,
          systemUpdates: false,
          reportReady: false,
          maintenanceDue: false
        }
      }
    },
    privacy: {
      shareAnalytics: false,
      allowDataCollection: true,
      publicProfile: false
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false
    }
  };

  Object.assign(this, defaults);
  return await this.save();
};

// Method to update notifications
settingsSchema.methods.updateNotifications = async function(type, settings) {
  const validTypes = ['email', 'browser', 'sms'];

  if (!validTypes.includes(type)) {
    throw new Error('Invalid notification type. Must be email, browser, or sms');
  }

  if (!this.notifications[type]) {
    this.notifications[type] = {};
  }

  Object.assign(this.notifications[type], settings);
  return await this.save();
};

// Static method to get system statistics
settingsSchema.statics.getSystemStats = function() {
  return this.aggregate([{
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      activeUsers: {
        $sum: { $cond: ['$dashboard.showNotifications', 1, 0] }
      },
      themeStats: {
        $push: '$theme'
      },
      languageStats: {
        $push: '$language'
      },
      notificationsEnabled: {
        $sum: {
          $cond: [
            { $or: ['$notifications.email.enabled', '$notifications.browser.enabled', '$notifications.sms.enabled'] },
            1,
            0
          ]
        }
      }
    }
  }, {
    $project: {
      totalUsers: 1,
      activeUsers: 1,
      themeStats: {
        light: { $size: { $filter: { input: '$themeStats', cond: { $eq: ['$$this', 'light'] } } } },
        dark: { $size: { $filter: { input: '$themeStats', cond: { $eq: ['$$this', 'dark'] } } } },
        auto: { $size: { $filter: { input: '$themeStats', cond: { $eq: ['$$this', 'auto'] } } } }
      },
      languageStats: {
        vi: { $size: { $filter: { input: '$languageStats', cond: { $eq: ['$$this', 'vi'] } } } },
        en: { $size: { $filter: { input: '$languageStats', cond: { $eq: ['$$this', 'en'] } } } }
      },
      notificationsEnabled: 1
    }
  }]);
};

// Pre-save middleware to validate risk thresholds
settingsSchema.pre('save', function(next) {
  const thresholds = this.riskThresholds;

  if (thresholds) {
    const validOrder = thresholds.veryLow < thresholds.low &&
                      thresholds.low < thresholds.medium &&
                      thresholds.medium < thresholds.high &&
                      thresholds.high < thresholds.veryHigh;

    if (!validOrder) {
      const error = new Error('Risk thresholds must be in ascending order');
      return next(error);
    }
  }

  next();
});

module.exports = mongoose.model('Settings', settingsSchema);

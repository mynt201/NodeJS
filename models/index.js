// Export all models for easy importing
const User = require("./User");
const Settings = require("./Settings");

// Schema mới - 4 bảng chính + indicator_thresholds
const AdministrativeUnit = require("./AdministrativeUnit");
const FloodIndicator = require("./FloodIndicator");
const IndicatorValue = require("./IndicatorValue");
const RiskAssessment = require("./RiskAssessment");
const IndicatorThreshold = require("./IndicatorThreshold");

module.exports = {
  User,
  Settings,
  AdministrativeUnit,
  FloodIndicator,
  IndicatorValue,
  RiskAssessment,
  IndicatorThreshold,
};

// Export individual models for direct access
module.exports.User = User;
module.exports.Settings = Settings;
module.exports.AdministrativeUnit = AdministrativeUnit;
module.exports.FloodIndicator = FloodIndicator;
module.exports.IndicatorValue = IndicatorValue;
module.exports.RiskAssessment = RiskAssessment;
module.exports.IndicatorThreshold = IndicatorThreshold;

// Export all models for easy importing
const User = require('./User');
const Ward = require('./Ward');
const WeatherData = require('./WeatherData');
const DrainageData = require('./DrainageData');
const RoadBridgeData = require('./RoadBridgeData');
const RiskIndexData = require('./RiskIndexData');

module.exports = {
    User,
    Ward,
    WeatherData,
    DrainageData,
    RoadBridgeData,
    RiskIndexData
};

// Export individual models for direct access
module.exports.User = User;
module.exports.Ward = Ward;
module.exports.WeatherData = WeatherData;
module.exports.DrainageData = DrainageData;
module.exports.RoadBridgeData = RoadBridgeData;
module.exports.RiskIndexData = RiskIndexData;
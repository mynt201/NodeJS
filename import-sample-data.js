const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Ward = require("./models/Ward");
const WeatherData = require("./models/WeatherData");
const DrainageData = require("./models/DrainageData");
const RoadBridgeData = require("./models/RoadBridgeData");
const RiskIndexData = require("./models/RiskIndexData");
const Settings = require("./models/Settings");

async function importSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL, {
      // Connection options
    });

    console.log("🗄️ Connected to MongoDB");

    // Read sample data
    const sampleDataPath = path.join(__dirname, "sample-data.json");
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, "utf8"));

    console.log("📥 Starting data import...");

    // Clear existing users and import fresh ones
    if (sampleData.users && sampleData.users.length > 0) {
      console.log(
        `👤 Clearing existing users and importing ${sampleData.users.length} new users...`,
      );
      await User.deleteMany({}); // Clear all existing users
      await User.insertMany(sampleData.users, {
        ordered: false,
      });
      console.log("✅ Users imported successfully");
    }

    // Import Wards
    if (sampleData.wards && sampleData.wards.length > 0) {
      console.log(`🏘️ Importing ${sampleData.wards.length} wards...`);
      try {
        await Ward.insertMany(sampleData.wards, {
          ordered: false,
        });
        console.log("✅ Wards imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Wards already exist, skipping...");
        } else {
          throw error;
        }
      }
    }

    // Import Weather Data
    if (sampleData.weather_data && sampleData.weather_data.length > 0) {
      console.log(
        `🌤️ Importing ${sampleData.weather_data.length} weather records...`,
      );
      try {
        await WeatherData.insertMany(sampleData.weather_data, {
          ordered: false,
        });
        console.log("✅ Weather data imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Weather data already exists, skipping...");
        } else {
          throw error;
        }
      }
    }

    // Import Drainage Data
    if (sampleData.drainage_data && sampleData.drainage_data.length > 0) {
      console.log(
        `🚰 Importing ${sampleData.drainage_data.length} drainage systems...`,
      );
      try {
        await DrainageData.insertMany(sampleData.drainage_data, {
          ordered: false,
        });
        console.log("✅ Drainage data imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Drainage data already exists, skipping...");
        } else {
          throw error;
        }
      }
    }

    // Import Road/Bridge Data
    if (sampleData.road_bridge_data && sampleData.road_bridge_data.length > 0) {
      console.log(
        `🛣️ Importing ${sampleData.road_bridge_data.length} road/bridge records...`,
      );
      try {
        await RoadBridgeData.insertMany(sampleData.road_bridge_data, {
          ordered: false,
        });
        console.log("✅ Road/Bridge data imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Road/Bridge data already exists, skipping...");
        } else {
          throw error;
        }
      }
    }

    // Import Risk Index Data
    if (sampleData.risk_index_data && sampleData.risk_index_data.length > 0) {
      console.log(
        `📊 Importing ${sampleData.risk_index_data.length} risk index records...`,
      );
      try {
        await RiskIndexData.insertMany(sampleData.risk_index_data, {
          ordered: false,
        });
        console.log("✅ Risk index data imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Risk index data already exists, skipping...");
        } else {
          throw error;
        }
      }
    }

    // Import Settings
    if (sampleData.settings && sampleData.settings.length > 0) {
      console.log(`⚙️ Importing ${sampleData.settings.length} settings...`);
      try {
        await Settings.insertMany(sampleData.settings, {
          ordered: false,
        });
        console.log("✅ Settings imported successfully");
      } catch (error) {
        if (error.code === 11000) {
          console.log("⚠️ Settings already exist, skipping...");
        } else {
          throw error;
        }
      }
    }

    console.log("🎉 All sample data imported successfully!");
    console.log("📋 Summary:");
    console.log(`   • ${sampleData.users?.length || 0} Users`);
    console.log(`   • ${sampleData.wards?.length || 0} Wards`);
    console.log(`   • ${sampleData.weather_data?.length || 0} Weather Records`);
    console.log(
      `   • ${sampleData.drainage_data?.length || 0} Drainage Systems`,
    );
    console.log(
      `   • ${sampleData.road_bridge_data?.length || 0} Road/Bridge Records`,
    );
    console.log(
      `   • ${sampleData.risk_index_data?.length || 0} Risk Index Records`,
    );
    console.log(`   • ${sampleData.settings?.length || 0} Settings`);

    console.log("\n🔑 Login credentials for testing:");
    console.log("   Admin: admin@floodrisk.com / admin123");
    console.log("   Manager: manager@floodrisk.com / admin123");
    console.log("   Officer: officer@floodrisk.com / admin123");
    console.log("   Researcher: researcher@university.edu.vn / admin123");
  } catch (error) {
    console.error("❌ Error importing sample data:", error.message);

    // If it's a duplicate key error, some data might already exist
    if (error.code === 11000) {
      console.log(
        "⚠️ Some data already exists. Try clearing the database first or use a different approach.",
      );
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
    process.exit(0);
  }
}

// Run the import
if (require.main === module) {
  importSampleData();
}

module.exports = {
  importSampleData,
};

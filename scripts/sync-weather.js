require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Ward = require('../models/Ward');
const WeatherData = require('../models/WeatherData');
const {
    getWeatherByCoordinates,
    getForecastByCoordinates,
    mapOpenWeatherToSchema,
    getWardCenterCoordinates
} = require('../services/weatherService');

/**
 * Sync weather data from OpenWeatherMap API for all wards in Ho Chi Minh City
 */
const syncWeatherData = async() => {
    try {
        console.log('🌤️  Starting weather data sync from OpenWeatherMap API...\n');

        // Check API key
        if (!process.env.OPENWEATHER_API_KEY) {
            console.error('❌ ERROR: OPENWEATHER_API_KEY is not configured in .env file');
            console.log('\n📝 Please add to your .env file:');
            console.log('   OPENWEATHER_API_KEY=your_api_key_here');
            console.log('\n🔗 Get your API key from: https://openweathermap.org/api');
            process.exit(1);
        }

        // Connect to database
        await connectDB();
        console.log('✅ Connected to database\n');

        // Get all wards in Ho Chi Minh City
        const wards = await Ward.find({
            $or: [
                { province: { $regex: /hồ chí minh|ho chi minh|hcm/i } },
                { province: { $regex: /thành phố hồ chí minh/i } }
            ]
        });

        if (wards.length === 0) {
            console.log('⚠️  No wards found in Ho Chi Minh City');
            console.log('💡 Make sure you have wards in the database first');
            process.exit(0);
        }

        console.log(`📊 Found ${wards.length} wards in Ho Chi Minh City\n`);

        const results = {
            successful: [],
            failed: [],
            skipped: []
        };

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Process each ward
        for (let i = 0; i < wards.length; i++) {
            const ward = wards[i];
            console.log(`[${i + 1}/${wards.length}] Processing: ${ward.ward_name} (${ward.district || 'N/A'})`);

            try {
                // Get center coordinates
                const { lat, lon } = getWardCenterCoordinates(ward);
                console.log(`   📍 Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);

                // Fetch current weather
                console.log('   🌡️  Fetching current weather...');
                const currentWeather = await getWeatherByCoordinates(lat, lon);

                // Map to schema
                const weatherData = mapOpenWeatherToSchema(
                    currentWeather,
                    ward._id,
                    currentDate,
                    false
                );

                // Check if exists
                const existing = await WeatherData.findOne({
                    ward_id: ward._id,
                    date: currentDate,
                    is_forecast: false
                });

                let savedWeather;
                if (existing) {
                    savedWeather = await WeatherData.findByIdAndUpdate(
                        existing._id,
                        weatherData, { new: true, runValidators: true }
                    );
                    console.log(`   ✅ Updated existing weather data`);
                    results.successful.push({
                        ward_id: ward._id,
                        ward_name: ward.ward_name,
                        action: 'updated'
                    });
                } else {
                    savedWeather = await WeatherData.create(weatherData);
                    console.log(`   ✅ Created new weather data`);
                    results.successful.push({
                        ward_id: ward._id,
                        ward_name: ward.ward_name,
                        action: 'created',
                        id: savedWeather._id
                    });
                }

                // Display weather info
                console.log(`   🌡️  Temp: ${savedWeather.temperature?.current || 'N/A'}°C`);
                console.log(`   💧 Humidity: ${savedWeather.humidity || 'N/A'}%`);
                console.log(`   🌧️  Rainfall: ${savedWeather.rainfall || 0}mm`);
                console.log(`   🌬️  Wind: ${savedWeather.wind_speed || 0} km/h`);
                console.log(`   ☁️  Condition: ${savedWeather.weather_condition?.main || 'N/A'}\n`);

                // Delay to avoid rate limiting (60 calls/minute for free tier)
                if (i < wards.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds delay
                }
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
                results.failed.push({
                    ward_id: ward._id,
                    ward_name: ward.ward_name,
                    error: error.message
                });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SYNC SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${results.successful.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        console.log(`📅 Date: ${currentDate.toISOString().split('T')[0]}`);
        console.log('='.repeat(60));

        if (results.failed.length > 0) {
            console.log('\n❌ Failed Wards:');
            results.failed.forEach(f => {
                console.log(`   - ${f.ward_name}: ${f.error}`);
            });
        }

        console.log('\n✅ Weather data sync completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
};

// Run sync
syncWeatherData();
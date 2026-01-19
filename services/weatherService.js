const axios = require('axios');

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather data from OpenWeatherMap API by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data from API
 */
const getWeatherByCoordinates = async(lat, lon) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OPENWEATHER_API_KEY is not configured in environment variables');
        }

        const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
            params: {
                lat: lat,
                lon: lon,
                appid: OPENWEATHER_API_KEY,
                units: 'metric', // Get temperature in Celsius
                lang: 'vi' // Vietnamese language
            },
            timeout: 10000 // 10 seconds timeout
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching weather from OpenWeatherMap:', error.message);
        if (error.response) {
            throw new Error(`OpenWeatherMap API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
        throw error;
    }
};

/**
 * Get weather forecast from OpenWeatherMap API by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} days - Number of days (1-5)
 * @returns {Promise<Object>} Forecast data from API
 */
const getForecastByCoordinates = async(lat, lon, days = 5) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OPENWEATHER_API_KEY is not configured in environment variables');
        }

        const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: {
                lat: lat,
                lon: lon,
                appid: OPENWEATHER_API_KEY,
                units: 'metric',
                lang: 'vi',
                cnt: days * 8 // 8 forecasts per day (3-hour intervals)
            },
            timeout: 10000
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching forecast from OpenWeatherMap:', error.message);
        if (error.response) {
            throw new Error(`OpenWeatherMap API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
        throw error;
    }
};

/**
 * Map OpenWeatherMap API response to WeatherData schema
 * @param {Object} apiData - Data from OpenWeatherMap API
 * @param {string} wardId - Ward ID
 * @param {Date} date - Date for the weather data
 * @param {boolean} isForecast - Whether this is forecast data
 * @returns {Object} Mapped weather data
 */
const mapOpenWeatherToSchema = (apiData, wardId, date, isForecast = false) => {
    const main = apiData.main || {};
    const weather = apiData.weather && apiData.weather[0] ? apiData.weather[0] : {};
    const wind = apiData.wind || {};
    const rain = apiData.rain || {};
    const clouds = apiData.clouds || {};

    // Map weather condition
    const weatherConditionMap = {
        'Clear': 'Clear',
        'Clouds': 'Clouds',
        'Rain': 'Rain',
        'Drizzle': 'Drizzle',
        'Thunderstorm': 'Thunderstorm',
        'Snow': 'Snow',
        'Mist': 'Mist',
        'Fog': 'Fog',
        'Haze': 'Mist',
        'Smoke': 'Mist',
        'Dust': 'Mist',
        'Sand': 'Mist',
        'Ash': 'Mist',
        'Squall': 'Thunderstorm',
        'Tornado': 'Thunderstorm'
    };

    const weatherMain = weatherConditionMap[weather.main] || 'Clear';

    // Calculate rainfall from rain object (3h forecast) or set to 0
    const rainfall = rain['3h'] || rain['1h'] || 0;

    return {
        ward_id: wardId,
        date: date,
        temperature: {
            current: main.temp || null,
            min: main.temp_min || null,
            max: main.temp_max || null,
            feels_like: main.feels_like || null
        },
        humidity: main.humidity || 0,
        rainfall: rainfall,
        wind_speed: wind.speed ? wind.speed * 3.6 : 0, // Convert m/s to km/h
        wind_direction: wind.deg || null,
        wind_gust: wind.gust ? wind.gust * 3.6 : null, // Convert m/s to km/h
        pressure: main.pressure || null,
        visibility: apiData.visibility ? apiData.visibility / 1000 : null, // Convert m to km
        weather_condition: {
            main: weatherMain,
            description: weather.description || '',
            icon: weather.icon || ''
        },
        uv_index: null, // Not available in current weather API
        aqi: null, // Not available in current weather API
        data_source: 'weather_api',
        is_forecast: isForecast,
        confidence_level: isForecast ? 85 : 100
    };
};

/**
 * Get center coordinates from ward geometry
 * @param {Object} ward - Ward object with geometry
 * @returns {Object} {lat, lon} coordinates
 */
const getWardCenterCoordinates = (ward) => {
    try {
        if (!ward.geometry || !ward.geometry.coordinates) {
            // Default to Ho Chi Minh City center if no coordinates
            return { lat: 10.7769, lon: 106.7009 };
        }

        const { type, coordinates } = ward.geometry;

        if (type === 'Point') {
            return {
                lat: coordinates[1],
                lon: coordinates[0]
            };
        } else if (type === 'Polygon' && coordinates[0] && coordinates[0].length > 0) {
            // Calculate centroid of polygon
            let sumLat = 0;
            let sumLon = 0;
            let count = 0;

            coordinates[0].forEach(coord => {
                if (Array.isArray(coord) && coord.length >= 2) {
                    sumLon += coord[0];
                    sumLat += coord[1];
                    count++;
                }
            });

            if (count > 0) {
                return {
                    lat: sumLat / count,
                    lon: sumLon / count
                };
            }
        }

        // Fallback to Ho Chi Minh City center
        return { lat: 10.7769, lon: 106.7009 };
    } catch (error) {
        console.error('Error calculating ward center:', error);
        return { lat: 10.7769, lon: 106.7009 };
    }
};

module.exports = {
    getWeatherByCoordinates,
    getForecastByCoordinates,
    mapOpenWeatherToSchema,
    getWardCenterCoordinates
};
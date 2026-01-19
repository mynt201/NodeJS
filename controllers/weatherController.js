const WeatherData = require('../models/WeatherData');
const Ward = require('../models/Ward');
const mongoose = require('mongoose');
const {
    handleValidationErrors,
    getWeatherDataValidation,
    getWeatherByIdValidation,
    createWeatherDataValidation,
    updateWeatherDataValidation,
    getWeatherByWardValidation,
    getWeatherStatsValidation,
    bulkImportWeatherValidation,
    buildDateFilter,
    buildPagination,
    buildSortOptions,
    handleDatabaseError,
    validateWardExists
} = require('../middleware/weatherValidation');
const {
    getWeatherByCoordinates,
    getForecastByCoordinates,
    mapOpenWeatherToSchema,
    getWardCenterCoordinates
} = require('../services/weatherService');

// @desc    Get weather data
// @route   GET /api/weather
// @access  Public
const getWeatherData = [
    ...getWeatherDataValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);

            // Build filter
            const filter = {};
            if (req.query.ward_id) {
                filter.ward_id = req.query.ward_id;
            }
            if (req.query.is_forecast !== undefined) {
                filter.is_forecast = req.query.is_forecast === 'true';
            }

            // Add date filter
            const dateFilter = buildDateFilter(req.query.date_from, req.query.date_to);
            Object.assign(filter, dateFilter);

            // Build sort options
            const sortOptions = buildSortOptions(req.query.sort, req.query.order);

            const weatherData = await WeatherData.find(filter)
                .populate('ward_id', 'ward_name district')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);

            const total = await WeatherData.countDocuments(filter);

            res.json({
                success: true,
                weatherData,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            });
        } catch (error) {
            handleDatabaseError(error, res, 'Server error retrieving weather data');
        }
    }
];

// @desc    Get weather data by ID
// @route   GET /api/weather/:id
// @access  Public
const getWeatherById = [
    ...getWeatherByIdValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const weather = await WeatherData.findById(req.params.id)
                .populate('ward_id', 'ward_name district coordinates');

            if (!weather) {
                return res.status(404).json({
                    success: false,
                    error: 'Weather data not found'
                });
            }

            res.json({
                success: true,
                weather
            });
        } catch (error) {
            handleDatabaseError(error, res, 'Server error retrieving weather data');
        }
    }
];

// @desc    Create weather data
// @route   POST /api/weather
// @access  Private/Admin
const createWeatherData = [
    ...createWeatherDataValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            // Validate ward exists (already checked in validation, but double-check)
            await validateWardExists(req.body.ward_id);

            // Create weather data
            const weather = await WeatherData.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Weather data created successfully',
                weather
            });
        } catch (error) {
            if (error.message === 'Ward not found') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
            handleDatabaseError(error, res, 'Server error creating weather data');
        }
    }
];

// @desc    Update weather data
// @route   PUT /api/weather/:id
// @access  Private/Admin
const updateWeatherData = [
    ...updateWeatherDataValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            // Check if weather data exists
            const existingWeather = await WeatherData.findById(req.params.id);
            if (!existingWeather) {
                return res.status(404).json({
                    success: false,
                    error: 'Weather data not found'
                });
            }

            // If ward_id is being changed, validate it
            if (req.body.ward_id && req.body.ward_id !== existingWeather.ward_id.toString()) {
                await validateWardExists(req.body.ward_id);
            }

            const weather = await WeatherData.findByIdAndUpdate(
                req.params.id,
                req.body, { new: true, runValidators: true }
            ).populate('ward_id', 'ward_name district');

            res.json({
                success: true,
                message: 'Weather data updated successfully',
                weather
            });
        } catch (error) {
            if (error.message === 'Ward not found') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
            handleDatabaseError(error, res, 'Server error updating weather data');
        }
    }
];

// @desc    Delete weather data
// @route   DELETE /api/weather/:id
// @access  Private/Admin
const deleteWeatherData = [
    ...getWeatherByIdValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const weather = await WeatherData.findById(req.params.id);

            if (!weather) {
                return res.status(404).json({
                    success: false,
                    error: 'Weather data not found'
                });
            }

            await WeatherData.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Weather data deleted successfully'
            });
        } catch (error) {
            handleDatabaseError(error, res, 'Server error deleting weather data');
        }
    }
];

// @desc    Get weather data for a specific ward
// @route   GET /api/weather/ward/:wardId
// @access  Public
const getWeatherByWard = [
    ...getWeatherByWardValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { wardId } = req.params;
            const { page, limit, skip } = buildPagination(req.query.page, req.query.limit || 30);

            // Check if ward exists
            const ward = await validateWardExists(wardId);

            const filter = { ward_id: wardId };
            const dateFilter = buildDateFilter(req.query.date_from, req.query.date_to);
            Object.assign(filter, dateFilter);

            const weatherData = await WeatherData.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit);

            const total = await WeatherData.countDocuments(filter);

            res.json({
                success: true,
                ward: {
                    _id: ward._id,
                    ward_name: ward.ward_name,
                    district: ward.district
                },
                weatherData,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            });
        } catch (error) {
            if (error.message === 'Ward not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Ward not found'
                });
            }
            handleDatabaseError(error, res, 'Server error retrieving weather data for ward');
        }
    }
];

// @desc    Get latest weather data for all wards
// @route   GET /api/weather/latest
// @access  Public
const getLatestWeather = async(req, res) => {
    try {
        const latestWeather = await WeatherData.getLatestForAllWards();

        res.json({
            success: true,
            latestWeather,
            count: latestWeather.length
        });
    } catch (error) {
        handleDatabaseError(error, res, 'Server error retrieving latest weather data');
    }
};

// @desc    Get weather statistics for a ward
// @route   GET /api/weather/stats/:wardId
// @access  Public
const getWeatherStats = [
    ...getWeatherStatsValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { wardId } = req.params;
            const days = parseInt(req.query.days) || 30;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Check if ward exists
            const ward = await validateWardExists(wardId);

            const stats = await WeatherData.aggregate([{
                    $match: {
                        ward_id: mongoose.Types.ObjectId(wardId),
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        avgTemperature: { $avg: '$temperature.current' },
                        maxTemperature: { $max: '$temperature.max' },
                        minTemperature: { $min: '$temperature.min' },
                        avgHumidity: { $avg: '$humidity' },
                        totalRainfall: { $sum: '$rainfall' },
                        avgRainfall: { $avg: '$rainfall' },
                        maxRainfall: { $max: '$rainfall' },
                        rainyDays: {
                            $sum: { $cond: [{ $gt: ['$rainfall', 0] }, 1, 0] }
                        }
                    }
                }
            ]);

            const result = stats[0] || {
                count: 0,
                avgTemperature: 0,
                maxTemperature: 0,
                minTemperature: 0,
                avgHumidity: 0,
                totalRainfall: 0,
                avgRainfall: 0,
                maxRainfall: 0,
                rainyDays: 0
            };

            res.json({
                success: true,
                ward: {
                    _id: ward._id,
                    ward_name: ward.ward_name,
                    district: ward.district
                },
                period: {
                    days,
                    startDate,
                    endDate: new Date()
                },
                statistics: result
            });
        } catch (error) {
            if (error.message === 'Ward not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Ward not found'
                });
            }
            handleDatabaseError(error, res, 'Server error retrieving weather statistics');
        }
    }
];

// @desc    Bulk import weather data
// @route   POST /api/weather/bulk-import
// @access  Private/Admin
const bulkImportWeather = [
    ...bulkImportWeatherValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { weatherData } = req.body;

            const results = {
                successful: [],
                failed: [],
                duplicates: []
            };

            for (const data of weatherData) {
                try {
                    // Check if ward exists
                    const ward = await validateWardExists(data.ward_id);

                    // Check for duplicates
                    const existing = await WeatherData.findOne({
                        ward_id: data.ward_id,
                        date: new Date(data.date)
                    });

                    if (existing) {
                        results.duplicates.push({
                            ward_id: data.ward_id,
                            ward_name: ward.ward_name,
                            date: data.date,
                            error: 'Weather data for this ward and date already exists'
                        });
                        continue;
                    }

                    // Create weather data
                    const weather = await WeatherData.create(data);
                    results.successful.push({
                        id: weather._id,
                        ward_name: ward.ward_name,
                        date: weather.date
                    });
                } catch (error) {
                    results.failed.push({
                        ward_id: data.ward_id || 'Unknown',
                        date: data.date || 'Unknown',
                        error: error.message === 'Ward not found' ? 'Ward not found' : error.message
                    });
                }
            }

            res.json({
                success: true,
                message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates`,
                results
            });
        } catch (error) {
            handleDatabaseError(error, res, 'Server error during bulk import');
        }
    }
];

// @desc    Sync weather data from OpenWeatherMap API
// @route   POST /api/weather/sync
// @access  Private/Admin
const syncWeatherFromAPI = async(req, res) => {
    try {
        const { ward_id, include_forecast = false } = req.body;

        const results = {
            successful: [],
            failed: [],
            skipped: []
        };

        let wards = [];

        // If specific ward_id provided, sync only that ward
        if (ward_id) {
            const ward = await Ward.findById(ward_id);
            if (!ward) {
                return res.status(404).json({
                    success: false,
                    error: 'Ward not found'
                });
            }
            wards = [ward];
        } else {
            // Sync all wards in Ho Chi Minh City
            wards = await Ward.find({
                province: { $regex: /hồ chí minh|ho chi minh|hcm/i }
            });
        }

        if (wards.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No wards found to sync'
            });
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const ward of wards) {
            try {
                // Get center coordinates of ward
                const { lat, lon } = getWardCenterCoordinates(ward);

                // Fetch current weather
                const currentWeather = await getWeatherByCoordinates(lat, lon);

                // Map and save current weather
                const weatherData = mapOpenWeatherToSchema(
                    currentWeather,
                    ward._id,
                    currentDate,
                    false
                );

                // Check if weather data already exists for this ward and date
                const existing = await WeatherData.findOne({
                    ward_id: ward._id,
                    date: currentDate,
                    is_forecast: false
                });

                if (existing) {
                    // Update existing record
                    await WeatherData.findByIdAndUpdate(existing._id, weatherData, {
                        new: true,
                        runValidators: true
                    });
                    results.successful.push({
                        ward_id: ward._id,
                        ward_name: ward.ward_name,
                        date: currentDate,
                        type: 'current',
                        action: 'updated'
                    });
                } else {
                    // Create new record
                    const weather = await WeatherData.create(weatherData);
                    results.successful.push({
                        ward_id: ward._id,
                        ward_name: ward.ward_name,
                        date: currentDate,
                        type: 'current',
                        action: 'created',
                        id: weather._id
                    });
                }

                // If include_forecast is true, fetch and save forecast data
                if (include_forecast) {
                    try {
                        const forecastData = await getForecastByCoordinates(lat, lon, 5);

                        if (forecastData.list && forecastData.list.length > 0) {
                            for (const forecast of forecastData.list) {
                                const forecastDate = new Date(forecast.dt * 1000);
                                forecastDate.setHours(0, 0, 0, 0);

                                // Only save forecasts for future dates
                                if (forecastDate > currentDate) {
                                    const mappedForecast = mapOpenWeatherToSchema(
                                        forecast,
                                        ward._id,
                                        forecastDate,
                                        true
                                    );

                                    // Check if forecast already exists
                                    const existingForecast = await WeatherData.findOne({
                                        ward_id: ward._id,
                                        date: forecastDate,
                                        is_forecast: true
                                    });

                                    if (existingForecast) {
                                        await WeatherData.findByIdAndUpdate(
                                            existingForecast._id,
                                            mappedForecast, { new: true, runValidators: true }
                                        );
                                    } else {
                                        await WeatherData.create(mappedForecast);
                                    }

                                    results.successful.push({
                                        ward_id: ward._id,
                                        ward_name: ward.ward_name,
                                        date: forecastDate,
                                        type: 'forecast',
                                        action: 'created'
                                    });
                                }
                            }
                        }
                    } catch (forecastError) {
                        console.error(`Error fetching forecast for ward ${ward.ward_name}:`, forecastError.message);
                        results.failed.push({
                            ward_id: ward._id,
                            ward_name: ward.ward_name,
                            error: `Forecast error: ${forecastError.message}`
                        });
                    }
                }

                // Add delay to avoid rate limiting (OpenWeatherMap free tier: 60 calls/minute)
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error syncing weather for ward ${ward.ward_name}:`, error.message);
                results.failed.push({
                    ward_id: ward._id,
                    ward_name: ward.ward_name,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Weather sync completed. ${results.successful.length} successful, ${results.failed.length} failed`,
            results: {
                total_wards: wards.length,
                successful: results.successful.length,
                failed: results.failed.length,
                details: {
                    successful: results.successful,
                    failed: results.failed
                }
            }
        });
    } catch (error) {
        console.error('Sync weather error:', error);
        handleDatabaseError(error, res, 'Server error syncing weather data');
    }
};

// @desc    Sync weather data for a specific ward from OpenWeatherMap API
// @route   POST /api/weather/sync/:wardId
// @access  Private/Admin
const syncWeatherForWard = async(req, res) => {
    try {
        const { wardId } = req.params;
        const { include_forecast = false } = req.query;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        // Get center coordinates of ward
        const { lat, lon } = getWardCenterCoordinates(ward);

        // Fetch current weather
        const currentWeather = await getWeatherByCoordinates(lat, lon);

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Map and save current weather
        const weatherData = mapOpenWeatherToSchema(
            currentWeather,
            ward._id,
            currentDate,
            false
        );

        // Check if weather data already exists
        const existing = await WeatherData.findOne({
            ward_id: ward._id,
            date: currentDate,
            is_forecast: false
        });

        let savedWeather;
        if (existing) {
            savedWeather = await WeatherData.findByIdAndUpdate(existing._id, weatherData, {
                new: true,
                runValidators: true
            });
        } else {
            savedWeather = await WeatherData.create(weatherData);
        }

        const result = {
            current: {
                action: existing ? 'updated' : 'created',
                weather: savedWeather
            },
            forecast: null
        };

        // If include_forecast is true, fetch and save forecast data
        if (include_forecast === 'true') {
            try {
                const forecastData = await getForecastByCoordinates(lat, lon, 5);
                const forecastResults = [];

                if (forecastData.list && forecastData.list.length > 0) {
                    for (const forecast of forecastData.list) {
                        const forecastDate = new Date(forecast.dt * 1000);
                        forecastDate.setHours(0, 0, 0, 0);

                        // Only save forecasts for future dates
                        if (forecastDate > currentDate) {
                            const mappedForecast = mapOpenWeatherToSchema(
                                forecast,
                                ward._id,
                                forecastDate,
                                true
                            );

                            const existingForecast = await WeatherData.findOne({
                                ward_id: ward._id,
                                date: forecastDate,
                                is_forecast: true
                            });

                            let savedForecast;
                            if (existingForecast) {
                                savedForecast = await WeatherData.findByIdAndUpdate(
                                    existingForecast._id,
                                    mappedForecast, { new: true, runValidators: true }
                                );
                            } else {
                                savedForecast = await WeatherData.create(mappedForecast);
                            }

                            forecastResults.push({
                                date: forecastDate,
                                action: existingForecast ? 'updated' : 'created',
                                weather: savedForecast
                            });
                        }
                    }
                }

                result.forecast = forecastResults;
            } catch (forecastError) {
                console.error('Error fetching forecast:', forecastError.message);
                result.forecast = {
                    error: forecastError.message
                };
            }
        }

        res.json({
            success: true,
            message: 'Weather data synced successfully',
            ward: {
                _id: ward._id,
                ward_name: ward.ward_name,
                district: ward.district
            },
            result
        });
    } catch (error) {
        console.error('Sync weather for ward error:', error);

        if (error.message.includes('OPENWEATHER_API_KEY')) {
            return res.status(400).json({
                success: false,
                error: 'OpenWeatherMap API key is not configured. Please set OPENWEATHER_API_KEY in environment variables.'
            });
        }

        handleDatabaseError(error, res, 'Server error syncing weather data for ward');
    }
};

module.exports = {
    getWeatherData,
    getWeatherById,
    createWeatherData,
    updateWeatherData,
    deleteWeatherData,
    getWeatherByWard,
    getLatestWeather,
    getWeatherStats,
    bulkImportWeather,
    syncWeatherFromAPI,
    syncWeatherForWard
};
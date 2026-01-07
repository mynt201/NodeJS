const WeatherData = require('../models/WeatherData');
const Ward = require('../models/Ward');

// @desc    Get weather data
// @route   GET /api/weather
// @access  Public
const getWeatherData = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.ward_id) filter.ward_id = req.query.ward_id;
        if (req.query.date_from || req.query.date_to) {
            filter.date = {};
            if (req.query.date_from) filter.date.$gte = new Date(req.query.date_from);
            if (req.query.date_to) filter.date.$lte = new Date(req.query.date_to);
        }
        if (req.query.is_forecast !== undefined) filter.is_forecast = req.query.is_forecast === 'true';

        // Build sort (default: newest first)
        const sortBy = req.query.sort || 'date';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const weatherData = await WeatherData.find(filter)
            .populate('ward_id', 'ward_name district')
            .sort({
                [sortBy]: sortOrder
            })
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
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving weather data'
        });
    }
};

// @desc    Get weather data by ID
// @route   GET /api/weather/:id
// @access  Public
const getWeatherById = async(req, res) => {
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
        console.error('Get weather by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving weather data'
        });
    }
};

// @desc    Create weather data
// @route   POST /api/weather
// @access  Private/Admin
const createWeatherData = async(req, res) => {
    try {
        const weatherData = {...req.body };

        // Check if ward exists
        const ward = await Ward.findById(weatherData.ward_id);
        if (!ward) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ward ID'
            });
        }

        // Create weather data
        const weather = await WeatherData.create(weatherData);

        res.status(201).json({
            success: true,
            message: 'Weather data created successfully',
            weather
        });
    } catch (error) {
        console.error('Create weather data error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Weather data for this ward and date already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error creating weather data'
        });
    }
};

// @desc    Update weather data
// @route   PUT /api/weather/:id
// @access  Private/Admin
const updateWeatherData = async(req, res) => {
    try {
        const updateData = {...req.body };

        // Check if weather data exists
        const existingWeather = await WeatherData.findById(req.params.id);
        if (!existingWeather) {
            return res.status(404).json({
                success: false,
                error: 'Weather data not found'
            });
        }

        // If ward_id is being changed, validate it
        if (updateData.ward_id && updateData.ward_id !== existingWeather.ward_id.toString()) {
            const ward = await Ward.findById(updateData.ward_id);
            if (!ward) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
        }

        const weather = await WeatherData.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true, runValidators: true }
        ).populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            message: 'Weather data updated successfully',
            weather
        });
    } catch (error) {
        console.error('Update weather data error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error updating weather data'
        });
    }
};

// @desc    Delete weather data
// @route   DELETE /api/weather/:id
// @access  Private/Admin
const deleteWeatherData = async(req, res) => {
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
        console.error('Delete weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting weather data'
        });
    }
};

// @desc    Get weather data for a specific ward
// @route   GET /api/weather/ward/:wardId
// @access  Public
const getWeatherByWard = async(req, res) => {
    try {
        const { wardId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        // Check if ward exists
        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const filter = { ward_id: wardId };
        if (req.query.date_from || req.query.date_to) {
            filter.date = {};
            if (req.query.date_from) filter.date.$gte = new Date(req.query.date_from);
            if (req.query.date_to) filter.date.$lte = new Date(req.query.date_to);
        }

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
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get weather by ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving weather data for ward'
        });
    }
};

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
        console.error('Get latest weather error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving latest weather data'
        });
    }
};

// @desc    Get weather statistics for a ward
// @route   GET /api/weather/stats/:wardId
// @access  Public
const getWeatherStats = async(req, res) => {
    try {
        const { wardId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Check if ward exists
        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const stats = await WeatherData.aggregate([{
                $match: {
                    ward_id: require('mongoose').Types.ObjectId(wardId),
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
        console.error('Get weather stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving weather statistics'
        });
    }
};

// @desc    Bulk import weather data
// @route   POST /api/weather/bulk-import
// @access  Private/Admin
const bulkImportWeather = async(req, res) => {
    try {
        const { weatherData } = req.body;

        if (!Array.isArray(weatherData) || weatherData.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Weather data array is required and cannot be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: []
        };

        for (const data of weatherData) {
            try {
                // Check if ward exists
                const ward = await Ward.findById(data.ward_id);
                if (!ward) {
                    results.failed.push({
                        ward_id: data.ward_id,
                        date: data.date,
                        error: 'Ward not found'
                    });
                    continue;
                }

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
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates`,
            results
        });
    } catch (error) {
        console.error('Bulk import weather error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during bulk import'
        });
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
    bulkImportWeather
};
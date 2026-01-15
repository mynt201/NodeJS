const Ward = require('../models/Ward');

// @desc    Get all wards
// @route   GET /api/wards
// @access  Public
const getWards = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { isActive: true };
        if (req.query.district) filter.district = req.query.district;
        if (req.query.province) filter.province = req.query.province;
        if (req.query.risk_level) filter.risk_level = req.query.risk_level;
        if (req.query.ward_name) filter.ward_name = req.query.ward_name;

        // Build sort
        const sortBy = req.query.sort || 'flood_risk';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const wards = await Ward.find(filter)
            .sort({
                [sortBy]: sortOrder
            })
            .skip(skip)
            .limit(limit);

        const total = await Ward.countDocuments(filter);

        res.json({
            success: true,
            wards,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get wards error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving wards'
        });
    }
};

// @desc    Get ward by ID
// @route   GET /api/wards/:id
// @access  Public
const getWardById = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id);

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        res.json({
            success: true,
            ward
        });
    } catch (error) {
        console.error('Get ward by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving ward'
        });
    }
};

// @desc    Get ward by name
// @route   GET /api/wards/name/:name
// @access  Public
const getWardByName = async (req, res) => {
    try {
        const ward = await Ward.findOne({
            ward_name: req.params.name,
            isActive: true
        });

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        res.json({
            success: true,
            ward
        });
    } catch (error) {
        console.error('Get ward by name error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving ward'
        });
    }
};

// @desc    Create new ward
// @route   POST /api/wards
// @access  Private/Admin
const createWard = async (req, res) => {
    try {
        const wardData = { ...req.body };

        // Check if ward code already exists
        const existingWardByCode = await Ward.findOne({ ward_code: wardData.ward_code });
        if (existingWardByCode) {
            return res.status(400).json({
                success: false,
                error: 'Ward with this code already exists'
            });
        }

        // Check if ward name already exists
        const existingWardByName = await Ward.findOne({ ward_name: wardData.ward_name });
        if (existingWardByName) {
            return res.status(400).json({
                success: false,
                error: 'Ward with this name already exists'
            });
        }

        // Create ward
        const ward = await Ward.create(wardData);

        // Calculate flood risk if all required parameters are provided
        if (ward.population_density && ward.rainfall && ward.low_elevation &&
            ward.urban_land && ward.drainage_capacity) {
            await ward.calculateFloodRisk();
        }

        res.status(201).json({
            success: true,
            message: 'Ward created successfully',
            ward
        });
    } catch (error) {
        console.error('Create ward error:', error);

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
            error: 'Server error creating ward'
        });
    }
};

// @desc    Update ward
// @route   PUT /api/wards/:id
// @access  Private/Admin
const updateWard = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Check if ward exists
        const existingWard = await Ward.findById(req.params.id);
        if (!existingWard) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        // Check if ward name is being changed and if it's already taken
        if (updateData.ward_name && updateData.ward_name !== existingWard.ward_name) {
            const nameExists = await Ward.findOne({
                ward_name: updateData.ward_name,
                _id: { $ne: req.params.id }
            });
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Ward with this name already exists'
                });
            }
        }

        // Update ward
        const ward = await Ward.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true, runValidators: true }
        );

        // Recalculate flood risk if parameters changed
        const riskParams = ['population_density', 'rainfall', 'low_elevation', 'urban_land', 'drainage_capacity'];
        const hasRiskParamChanged = riskParams.some(param => updateData[param] !== undefined);

        if (hasRiskParamChanged && ward.population_density && ward.rainfall &&
            ward.low_elevation && ward.urban_land && ward.drainage_capacity) {
            await ward.calculateFloodRisk();
            // Fetch updated ward with new risk calculations
            const updatedWard = await Ward.findById(req.params.id);
            return res.json({
                success: true,
                message: 'Ward updated successfully with risk recalculation',
                ward: updatedWard
            });
        }

        res.json({
            success: true,
            message: 'Ward updated successfully',
            ward
        });
    } catch (error) {
        console.error('Update ward error:', error);

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
            error: 'Server error updating ward'
        });
    }
};

// @desc    Delete ward
// @route   DELETE /api/wards/:id
// @access  Private/Admin
const deleteWard = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id);

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        // Soft delete - set isActive to false
        ward.isActive = false;
        await ward.save();

        res.json({
            success: true,
            message: 'Ward deleted successfully'
        });
    } catch (error) {
        console.error('Delete ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting ward'
        });
    }
};

// @desc    Calculate flood risk for a ward
// @route   POST /api/wards/:id/calculate-risk
// @access  Private/Admin
const calculateRisk = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id);

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        // Check if ward has all required parameters
        if (!ward.population_density || !ward.rainfall || !ward.low_elevation ||
            !ward.urban_land || !ward.drainage_capacity) {
            return res.status(400).json({
                success: false,
                error: 'Ward must have all risk parameters to calculate flood risk'
            });
        }

        await ward.calculateFloodRisk();

        // Fetch updated ward
        const updatedWard = await Ward.findById(req.params.id);

        res.json({
            success: true,
            message: 'Flood risk calculated successfully',
            ward: updatedWard
        });
    } catch (error) {
        console.error('Calculate risk error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error calculating flood risk'
        });
    }
};

// @desc    Get wards by risk level
// @route   GET /api/wards/risk/:level
// @access  Public
const getWardsByRiskLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const validLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

        if (!validLevels.includes(level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid risk level. Must be: Very Low, Low, Medium, High, Very High'
            });
        }

        const wards = await Ward.find({
            risk_level: level,
            isActive: true
        }).sort({ flood_risk: -1 });

        res.json({
            success: true,
            count: wards.length,
            wards
        });
    } catch (error) {
        console.error('Get wards by risk level error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving wards by risk level'
        });
    }
};

// @desc    Get ward statistics
// @route   GET /api/wards/stats
// @access  Public
const getWardStats = async (req, res) => {
    try {
        const stats = await Ward.getStatistics();

        // Get risk level distribution
        const riskDistribution = await Ward.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$risk_level',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    risk_level: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Calculate percentages
        // const totalWards = stats[0]? .totalWards || 0;
        const riskLevelStats = riskDistribution.map(item => ({
            label: item.risk_level,
            count: item.count,
            percentage: totalWards > 0 ? ((item.count / totalWards) * 100).toFixed(1) : 0
        }));

        res.json({
            success: true,
            statistics: stats[0] || {
                totalWards: 0,
                avgRisk: 0,
                maxRisk: 0,
                avgRainfall: 0,
                avgElevation: 0,
                avgDrainage: 0,
                totalPopulation: 0
            },
            riskDistribution: riskLevelStats
        });
    } catch (error) {
        console.error('Get ward stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving ward statistics'
        });
    }
};

// @desc    Bulk import wards
// @route   POST /api/wards/bulk-import
// @access  Private/Admin
const bulkImportWards = async (req, res) => {
    try {
        const { wards } = req.body;

        if (!Array.isArray(wards) || wards.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Wards array is required and cannot be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: []
        };

        for (const wardData of wards) {
            try {
                // Check for duplicates by ward_code
                const existingWardByCode = await Ward.findOne({ ward_code: wardData.ward_code });
                if (existingWardByCode) {
                    results.duplicates.push({
                        ward_code: wardData.ward_code,
                        reason: 'Ward code already exists'
                    });
                    continue;
                }

                // Check for duplicates by ward_name
                const existingWardByName = await Ward.findOne({ ward_name: wardData.ward_name });
                if (existingWardByName) {
                    results.duplicates.push({
                        ward_name: wardData.ward_name,
                        reason: 'Ward name already exists'
                    });
                    continue;
                }

                // Create ward
                const ward = await Ward.create(wardData);

                // Calculate risk if parameters are available
                if (ward.population_density && ward.rainfall && ward.low_elevation &&
                    ward.urban_land && ward.drainage_capacity) {
                    await ward.calculateFloodRisk();
                }

                results.successful.push({
                    id: ward._id,
                    ward_name: ward.ward_name
                });
            } catch (error) {
                results.failed.push({
                    ward_name: wardData.ward_name || 'Unknown',
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
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during bulk import'
        });
    }
};

module.exports = {
    getWards,
    getWardById,
    getWardByName,
    createWard,
    updateWard,
    deleteWard,
    calculateRisk,
    getWardsByRiskLevel,
    getWardStats,
    bulkImportWards
};
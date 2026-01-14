const DrainageData = require('../models/DrainageData');
const Ward = require('../models/Ward');

// @desc    Get drainage data
// @route   GET /api/drainage
// @access  Public
const getDrainageData = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { status: 'operational' };
        if (req.query.ward_id) filter.ward_id = req.query.ward_id;
        if (req.query.type) filter.type = req.query.type;
        if (req.query.condition) filter.condition = req.query.condition;

        const drainageData = await DrainageData.find(filter)
            .populate('ward_id', 'ward_name district')
            .sort({ condition_score: 1 }) // Show critical conditions first
            .skip(skip)
            .limit(limit);

        const total = await DrainageData.countDocuments(filter);

        res.json({
            success: true,
            drainageData,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get drainage data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving drainage data'
        });
    }
};

// @desc    Get drainage by ID
// @route   GET /api/drainage/:id
// @access  Public
const getDrainageById = async (req, res) => {
    try {
        const drainage = await DrainageData.findById(req.params.id)
            .populate('ward_id', 'ward_name district coordinates');

        if (!drainage) {
            return res.status(404).json({
                success: false,
                error: 'Drainage data not found'
            });
        }

        res.json({
            success: true,
            drainage
        });
    } catch (error) {
        console.error('Get drainage by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving drainage data'
        });
    }
};

// @desc    Create drainage data
// @route   POST /api/drainage
// @access  Private/Admin
const createDrainageData = async (req, res) => {
    try {
        const drainageData = { ...req.body };

        const ward = await Ward.findById(drainageData.ward_id);
        if (!ward) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ward ID'
            });
        }

        const drainage = await DrainageData.create(drainageData);

        res.status(201).json({
            success: true,
            message: 'Drainage data created successfully',
            drainage
        });
    } catch (error) {
        console.error('Create drainage data error:', error);

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
            error: 'Server error creating drainage data'
        });
    }
};

// @desc    Update drainage data
// @route   PUT /api/drainage/:id
// @access  Private/Admin
const updateDrainageData = async (req, res) => {
    try {
        const updateData = { ...req.body };

        const existingDrainage = await DrainageData.findById(req.params.id);
        if (!existingDrainage) {
            return res.status(404).json({
                success: false,
                error: 'Drainage data not found'
            });
        }

        if (updateData.ward_id && updateData.ward_id !== existingDrainage.ward_id.toString()) {
            const ward = await Ward.findById(updateData.ward_id);
            if (!ward) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
        }

        const drainage = await DrainageData.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true, runValidators: true }
        ).populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            message: 'Drainage data updated successfully',
            drainage
        });
    } catch (error) {
        console.error('Update drainage data error:', error);

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
            error: 'Server error updating drainage data'
        });
    }
};

// @desc    Delete drainage data
// @route   DELETE /api/drainage/:id
// @access  Private/Admin
const deleteDrainageData = async (req, res) => {
    try {
        const drainage = await DrainageData.findById(req.params.id);

        if (!drainage) {
            return res.status(404).json({
                success: false,
                error: 'Drainage data not found'
            });
        }

        await DrainageData.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Drainage data deleted successfully'
        });
    } catch (error) {
        console.error('Delete drainage data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting drainage data'
        });
    }
};

// @desc    Get drainage data by ward
// @route   GET /api/drainage/ward/:wardId
// @access  Public
const getDrainageByWard = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const drainageData = await DrainageData.find({
            ward_id: req.params.wardId,
            status: 'operational'
        }).sort({ condition_score: 1 });

        res.json({
            success: true,
            ward: {
                _id: ward._id,
                ward_name: ward.ward_name,
                district: ward.district
            },
            drainageData,
            count: drainageData.length
        });
    } catch (error) {
        console.error('Get drainage by ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving drainage data for ward'
        });
    }
};

// @desc    Get drainage statistics
// @route   GET /api/drainage/stats
// @access  Public
const getDrainageStats = async (req, res) => {
    try {
        const stats = await DrainageData.aggregate([
            { $match: { status: 'operational' } },
            {
                $group: {
                    _id: null,
                    totalSystems: { $sum: 1 },
                    byType: {
                        $push: '$type'
                    },
                    byCondition: {
                        $push: '$condition'
                    },
                    avgEfficiency: { $avg: '$efficiency_percentage' },
                    totalLength: { $sum: '$length' }
                }
            }
        ]);

        const result = stats[0] || {
            totalSystems: 0,
            avgEfficiency: 0,
            totalLength: 0
        };

        // Count by type and condition
        if (result.byType) {
            const typeCount = {};
            result.byType.forEach(type => {
                typeCount[type] = (typeCount[type] || 0) + 1;
            });
            result.typeDistribution = typeCount;
        }

        if (result.byCondition) {
            const conditionCount = {};
            result.byCondition.forEach(condition => {
                conditionCount[condition] = (conditionCount[condition] || 0) + 1;
            });
            result.conditionDistribution = conditionCount;
        }

        delete result.byType;
        delete result.byCondition;

        res.json({
            success: true,
            statistics: result
        });
    } catch (error) {
        console.error('Get drainage stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving drainage statistics'
        });
    }
};

// @desc    Get systems needing maintenance
// @route   GET /api/drainage/maintenance-needed
// @access  Public
const getMaintenanceNeeded = async (req, res) => {
    try {
        const systems = await DrainageData.getNeedingMaintenance()
            .populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            maintenanceNeeded: systems,
            count: systems.length
        });
    } catch (error) {
        console.error('Get maintenance needed error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving maintenance data'
        });
    }
};

// @desc    Bulk import drainage data
// @route   POST /api/drainage/bulk-import
// @access  Private/Admin
const bulkImportDrainage = async (req, res) => {
    try {
        const { drainageData } = req.body;

        if (!Array.isArray(drainageData) || drainageData.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Drainage data array is required and cannot be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: []
        };

        for (const data of drainageData) {
            try {
                // Check for duplicates by drainage_id
                const existingDrainage = await DrainageData.findOne({ drainage_id: data.drainage_id });
                if (existingDrainage) {
                    results.duplicates.push({
                        drainage_id: data.drainage_id,
                        reason: 'Drainage ID already exists'
                    });
                    continue;
                }

                // Find ward by ward_code
                const ward = await Ward.findOne({ ward_code: data.ward_code });
                if (!ward) {
                    results.failed.push({
                        drainage_id: data.drainage_id || 'Unknown',
                        error: `Ward with code ${data.ward_code} not found`
                    });
                    continue;
                }

                // Create drainage data
                const drainage = await DrainageData.create({
                    drainage_id: data.drainage_id,
                    ward_id: ward._id,
                    drainage_type: data.drainage_type || 'Main Drain',
                    length: data.length || 0,
                    diameter: data.diameter || 0,
                    material: data.material || 'Concrete',
                    coordinates: data.coordinates ? JSON.parse(data.coordinates) : [],
                    status: data.status || 'Active',
                    last_maintenance: data.last_maintenance || null,
                    description: data.description || ''
                });

                results.successful.push({
                    id: drainage._id,
                    drainage_id: drainage.drainage_id
                });
            } catch (error) {
                results.failed.push({
                    drainage_id: data.drainage_id || 'Unknown',
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
        console.error('Bulk import drainage error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during bulk import'
        });
    }
};

module.exports = {
    getDrainageData,
    getDrainageById,
    createDrainageData,
    updateDrainageData,
    deleteDrainageData,
    getDrainageByWard,
    getDrainageStats,
    getMaintenanceNeeded,
    bulkImportDrainage
};
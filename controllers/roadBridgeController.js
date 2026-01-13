const RoadBridgeData = require('../models/RoadBridgeData');
const Ward = require('../models/Ward');

// @desc    Get road/bridge data
// @route   GET /api/road-bridge
// @access  Public
const getRoadBridgeData = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { status: 'operational' };
        if (req.query.ward_id) filter.ward_id = req.query.ward_id;
        if (req.query.type) filter.type = req.query.type;
        if (req.query.condition) filter.condition = req.query.condition;

        const roadBridgeData = await RoadBridgeData.find(filter)
            .populate('ward_id', 'ward_name district')
            .sort({ criticality_level: -1, flood_level: -1 })
            .skip(skip)
            .limit(limit);

        const total = await RoadBridgeData.countDocuments(filter);

        res.json({
            success: true,
            roadBridgeData,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get road bridge data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving road/bridge data'
        });
    }
};

// @desc    Get road/bridge by ID
// @route   GET /api/road-bridge/:id
// @access  Public
const getRoadBridgeById = async(req, res) => {
    try {
        const roadBridge = await RoadBridgeData.findById(req.params.id)
            .populate('ward_id', 'ward_name district coordinates');

        if (!roadBridge) {
            return res.status(404).json({
                success: false,
                error: 'Road/bridge data not found'
            });
        }

        res.json({
            success: true,
            roadBridge
        });
    } catch (error) {
        console.error('Get road bridge by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving road/bridge data'
        });
    }
};

// @desc    Create road/bridge data
// @route   POST /api/road-bridge
// @access  Private/Admin
const createRoadBridgeData = async(req, res) => {
    try {
        const roadBridgeData = {...req.body };

        const ward = await Ward.findById(roadBridgeData.ward_id);
        if (!ward) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ward ID'
            });
        }

        const roadBridge = await RoadBridgeData.create(roadBridgeData);

        res.status(201).json({
            success: true,
            message: 'Road/bridge data created successfully',
            roadBridge
        });
    } catch (error) {
        console.error('Create road bridge data error:', error);

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
            error: 'Server error creating road/bridge data'
        });
    }
};

// @desc    Update road/bridge data
// @route   PUT /api/road-bridge/:id
// @access  Private/Admin
const updateRoadBridgeData = async(req, res) => {
    try {
        const updateData = {...req.body };

        const existingRoadBridge = await RoadBridgeData.findById(req.params.id);
        if (!existingRoadBridge) {
            return res.status(404).json({
                success: false,
                error: 'Road/bridge data not found'
            });
        }

        if (updateData.ward_id && updateData.ward_id !== existingRoadBridge.ward_id.toString()) {
            const ward = await Ward.findById(updateData.ward_id);
            if (!ward) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
        }

        const roadBridge = await RoadBridgeData.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true, runValidators: true }
        ).populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            message: 'Road/bridge data updated successfully',
            roadBridge
        });
    } catch (error) {
        console.error('Update road bridge data error:', error);

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
            error: 'Server error updating road/bridge data'
        });
    }
};

// @desc    Delete road/bridge data
// @route   DELETE /api/road-bridge/:id
// @access  Private/Admin
const deleteRoadBridgeData = async(req, res) => {
    try {
        const roadBridge = await RoadBridgeData.findById(req.params.id);

        if (!roadBridge) {
            return res.status(404).json({
                success: false,
                error: 'Road/bridge data not found'
            });
        }

        await RoadBridgeData.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Road/bridge data deleted successfully'
        });
    } catch (error) {
        console.error('Delete road bridge data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting road/bridge data'
        });
    }
};

// @desc    Get road/bridge data by ward
// @route   GET /api/road-bridge/ward/:wardId
// @access  Public
const getRoadBridgeByWard = async(req, res) => {
    try {
        const ward = await Ward.findById(req.params.wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const roadBridgeData = await RoadBridgeData.find({
            ward_id: req.params.wardId,
            status: 'operational'
        }).sort({ criticality_level: -1, flood_level: -1 });

        res.json({
            success: true,
            ward: {
                _id: ward._id,
                ward_name: ward.ward_name,
                district: ward.district
            },
            roadBridgeData,
            count: roadBridgeData.length
        });
    } catch (error) {
        console.error('Get road bridge by ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving road/bridge data for ward'
        });
    }
};

// @desc    Get high-risk infrastructure
// @route   GET /api/road-bridge/high-risk
// @access  Public
const getHighRiskInfrastructure = async(req, res) => {
    try {
        const highRiskInfra = await RoadBridgeData.getHighRiskInfrastructure()
            .populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            highRiskInfrastructure: highRiskInfra,
            count: highRiskInfra.length
        });
    } catch (error) {
        console.error('Get high risk infrastructure error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving high-risk infrastructure'
        });
    }
};

// @desc    Get infrastructure needing inspection
// @route   GET /api/road-bridge/inspection-needed
// @access  Public
const getInspectionNeeded = async(req, res) => {
    try {
        const inspectionNeeded = await RoadBridgeData.getNeedingInspection()
            .populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            inspectionNeeded,
            count: inspectionNeeded.length
        });
    } catch (error) {
        console.error('Get inspection needed error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving inspection data'
        });
    }
};

// @desc    Bulk import road bridge data
// @route   POST /api/road-bridge/bulk-import
// @access  Private/Admin
const bulkImportRoadBridge = async(req, res) => {
    try {
        const { roadBridgeData } = req.body;

        if (!Array.isArray(roadBridgeData) || roadBridgeData.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Road bridge data array is required and cannot be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: []
        };

        for (const data of roadBridgeData) {
            try {
                // Check for duplicates by structure_id
                const existingStructure = await RoadBridgeData.findOne({ structure_id: data.structure_id });
                if (existingStructure) {
                    results.duplicates.push({
                        structure_id: data.structure_id,
                        reason: 'Structure ID already exists'
                    });
                    continue;
                }

                // Find ward by ward_code
                const ward = await Ward.findOne({ ward_code: data.ward_code });
                if (!ward) {
                    results.failed.push({
                        structure_id: data.structure_id || 'Unknown',
                        error: `Ward with code ${data.ward_code} not found`
                    });
                    continue;
                }

                // Create road bridge data
                const structure = await RoadBridgeData.create({
                    structure_id: data.structure_id,
                    ward_id: ward._id,
                    structure_type: data.structure_type || 'Road',
                    name: data.name,
                    length: data.length || 0,
                    width: data.width || 0,
                    height: data.height || 0,
                    material: data.material || 'Asphalt',
                    coordinates: data.coordinates ? JSON.parse(data.coordinates) : [],
                    status: data.status || 'Good',
                    last_inspection: data.last_inspection || null,
                    description: data.description || ''
                });

                results.successful.push({
                    id: structure._id,
                    structure_id: structure.structure_id
                });
            } catch (error) {
                results.failed.push({
                    structure_id: data.structure_id || 'Unknown',
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
        console.error('Bulk import road bridge error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during bulk import'
        });
    }
};

module.exports = {
    getRoadBridgeData,
    getRoadBridgeById,
    createRoadBridgeData,
    updateRoadBridgeData,
    deleteRoadBridgeData,
    getRoadBridgeByWard,
    getHighRiskInfrastructure,
    getInspectionNeeded,
    bulkImportRoadBridge
};
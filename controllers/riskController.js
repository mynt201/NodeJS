const RiskIndexData = require('../models/RiskIndexData');
const Ward = require('../models/Ward');

// @desc    Get risk index data
// @route   GET /api/risk-index
// @access  Public
const getRiskIndexData = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.ward_id) filter.ward_id = req.query.ward_id;
        if (req.query.risk_category) filter.risk_category = req.query.risk_category;
        if (req.query.date_from || req.query.date_to) {
            filter.date = {};
            if (req.query.date_from) filter.date.$gte = new Date(req.query.date_from);
            if (req.query.date_to) filter.date.$lte = new Date(req.query.date_to);
        }

        const riskData = await RiskIndexData.find(filter)
            .populate('ward_id', 'ward_name district')
            .sort({ date: -1, risk_index: -1 })
            .skip(skip)
            .limit(limit);

        const total = await RiskIndexData.countDocuments(filter);

        res.json({
            success: true,
            riskData,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get risk index data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving risk index data'
        });
    }
};

// @desc    Get risk data by ID
// @route   GET /api/risk-index/:id
// @access  Public
const getRiskById = async (req, res) => {
    try {
        const riskData = await RiskIndexData.findById(req.params.id)
            .populate('ward_id', 'ward_name district coordinates')
            .populate('validated_by', 'username fullName');

        if (!riskData) {
            return res.status(404).json({
                success: false,
                error: 'Risk index data not found'
            });
        }

        res.json({
            success: true,
            riskData
        });
    } catch (error) {
        console.error('Get risk by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving risk data'
        });
    }
};

// @desc    Create risk index data
// @route   POST /api/risk-index
// @access  Private/Admin
const createRiskIndexData = async (req, res) => {
    try {
        const riskData = { ...req.body };

        const ward = await Ward.findById(riskData.ward_id);
        if (!ward) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ward ID'
            });
        }

        // Auto-calculate risk category if not provided
        if (!riskData.risk_category && riskData.risk_index) {
            riskData.risk_category = RiskIndexData.prototype.updateRiskCategory.call({
                risk_index: riskData.risk_index
            });
        }

        const riskIndex = await RiskIndexData.create(riskData);

        res.status(201).json({
            success: true,
            message: 'Risk index data created successfully',
            riskIndex
        });
    } catch (error) {
        console.error('Create risk index data error:', error);

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
            error: 'Server error creating risk index data'
        });
    }
};

// @desc    Update risk index data
// @route   PUT /api/risk-index/:id
// @access  Private/Admin
const updateRiskIndexData = async (req, res) => {
    try {
        const updateData = { ...req.body };

        const existingRisk = await RiskIndexData.findById(req.params.id);
        if (!existingRisk) {
            return res.status(404).json({
                success: false,
                error: 'Risk index data not found'
            });
        }

        if (updateData.ward_id && updateData.ward_id !== existingRisk.ward_id.toString()) {
            const ward = await Ward.findById(updateData.ward_id);
            if (!ward) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ward ID'
                });
            }
        }

        const riskIndex = await RiskIndexData.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true, runValidators: true }
        ).populate('ward_id', 'ward_name district');

        res.json({
            success: true,
            message: 'Risk index data updated successfully',
            riskIndex
        });
    } catch (error) {
        console.error('Update risk index data error:', error);

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
            error: 'Server error updating risk index data'
        });
    }
};

// @desc    Delete risk index data
// @route   DELETE /api/risk-index/:id
// @access  Private/Admin
const deleteRiskIndexData = async (req, res) => {
    try {
        const riskData = await RiskIndexData.findById(req.params.id);

        if (!riskData) {
            return res.status(404).json({
                success: false,
                error: 'Risk index data not found'
            });
        }

        await RiskIndexData.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Risk index data deleted successfully'
        });
    } catch (error) {
        console.error('Delete risk index data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting risk index data'
        });
    }
};

// @desc    Get risk history for a ward
// @route   GET /api/risk-index/ward/:wardId
// @access  Public
const getRiskHistoryByWard = async (req, res) => {
    try {
        const { wardId } = req.params;
        const limit = parseInt(req.query.limit) || 30;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const riskHistory = await RiskIndexData.getWardRiskHistory(wardId, limit);

        res.json({
            success: true,
            ward: {
                _id: ward._id,
                ward_name: ward.ward_name,
                district: ward.district
            },
            // riskHistory: riskHistory[0]?.data || [],
            // count: riskHistory[0] ? .data ? .length || 0
        });
    } catch (error) {
        console.error('Get risk history by ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving risk history'
        });
    }
};

// @desc    Get current risk levels for all wards
// @route   GET /api/risk-index/current
// @access  Public
const getCurrentRiskLevels = async (req, res) => {
    try {
        const currentRiskLevels = await RiskIndexData.getCurrentRiskLevels();

        res.json({
            success: true,
            currentRiskLevels,
            count: currentRiskLevels.length
        });
    } catch (error) {
        console.error('Get current risk levels error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving current risk levels'
        });
    }
};

// @desc    Recalculate risk index
// @route   POST /api/risk-index/:id/recalculate
// @access  Private/Admin
const recalculateRisk = async (req, res) => {
    try {
        const riskData = await RiskIndexData.findById(req.params.id);

        if (!riskData) {
            return res.status(404).json({
                success: false,
                error: 'Risk index data not found'
            });
        }

        await riskData.recalculateRiskIndex();

        const updatedRisk = await RiskIndexData.findById(req.params.id);

        res.json({
            success: true,
            message: 'Risk index recalculated successfully',
            riskData: updatedRisk
        });
    } catch (error) {
        console.error('Recalculate risk error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error recalculating risk index'
        });
    }
};

// @desc    Get risk trend analysis
// @route   GET /api/risk-index/trend/:wardId
// @access  Public
const getRiskTrend = async (req, res) => {
    try {
        const { wardId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        const trendData = await RiskIndexData.getRiskTrendAnalysis(wardId, days);

        res.json({
            success: true,
            ward: {
                _id: ward._id,
                ward_name: ward.ward_name,
                district: ward.district
            },
            trendAnalysis: trendData[0] || {
                avg_risk: 0,
                max_risk: 0,
                min_risk: 0
            },
            period: { days }
        });
    } catch (error) {
        console.error('Get risk trend error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving risk trend analysis'
        });
    }
};

// @desc    Bulk import risk index data
// @route   POST /api/risk/bulk-import
// @access  Private/Admin
const bulkImportRisk = async (req, res) => {
    try {
        const { riskData } = req.body;

        if (!Array.isArray(riskData) || riskData.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Risk data array is required and cannot be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: []
        };

        for (const data of riskData) {
            try {
                // Find ward by ward_name (ward_id in CSV maps to ward_name)
                const ward = await Ward.findOne({ ward_name: data.ward_id || data.ward_name });
                if (!ward) {
                    results.failed.push({
                        ward_id: data.ward_id || 'Unknown',
                        error: `Ward with name ${data.ward_id || data.ward_name} not found`
                    });
                    continue;
                }

                // Check for duplicates by ward_id and date
                const existingRisk = await RiskIndexData.findOne({
                    ward_id: ward._id,
                    date: new Date(data.date)
                });
                if (existingRisk) {
                    results.duplicates.push({
                        ward_id: ward._id,
                        date: data.date,
                        reason: 'Risk data for this ward and date already exists'
                    });
                    continue;
                }

                // Create risk index data
                const riskRecord = await RiskIndexData.create({
                    ward_id: ward._id,
                    date: new Date(data.date),
                    exposure: data.exposure || 0,
                    susceptibility: data.susceptibility || 0,
                    resilience: data.resilience || 0,
                    risk_index: data.risk_index || 0,
                    risk_category: data.risk_category || 'Low',
                    description: data.description || ''
                });

                results.successful.push({
                    id: riskRecord._id,
                    ward_code: riskRecord.ward_code,
                    date: riskRecord.date
                });
            } catch (error) {
                results.failed.push({
                    ward_code: data.ward_code || 'Unknown',
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
        console.error('Bulk import risk error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during bulk import'
        });
    }
};

module.exports = {
    getRiskIndexData,
    getRiskById,
    createRiskIndexData,
    updateRiskIndexData,
    deleteRiskIndexData,
    getRiskHistoryByWard,
    getCurrentRiskLevels,
    recalculateRisk,
    getRiskTrend,
    bulkImportRisk
};
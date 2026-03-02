const IndicatorValue = require('../models/IndicatorValue');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');

/**
 * Chuẩn hóa Min-Max:
 * - Thuận (direction=1): I = (x - Min) / (Max - Min) — càng cao càng rủi ro
 * - Nghịch (direction=0): I = (Max - x) / (Max - Min) — càng cao càng an toàn
 */
async function recomputeMinMaxNormalized(indicatorId, dataYear) {
    const indicator = await FloodIndicator.findById(indicatorId).select('code direction');
    if (!indicator) return;
    const isInverse = (indicator.direction ? 1 : 0) === 0;

    const values = await IndicatorValue.find({
        indicator_id: indicatorId,
        data_year: dataYear
    });
    if (values.length === 0) return;

    const rawValues = values.map((v) => v.raw_value);
    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);
    const range = max - min;

    for (const v of values) {
        let n;
        if (range === 0) {
            n = 0.5;
        } else if (isInverse) {
            n = (max - v.raw_value) / range;
        } else {
            n = (v.raw_value - min) / range;
        }
        v.normalized_value = Math.max(0, Math.min(1, n));
        await v.save();
    }
}

const getValues = async (req, res) => {
    try {
        const filter = {};
        if (req.query.unit_id) filter.unit_id = req.query.unit_id;
        if (req.query.indicator_id) filter.indicator_id = req.query.indicator_id;
        if (req.query.data_year || req.query.year) filter.data_year = parseInt(req.query.data_year || req.query.year);

        const values = await IndicatorValue.find(filter)
            .populate('unit_id', 'name')
            .populate('indicator_id', 'code name group_type weight unit')
            .populate('updated_by', 'username full_name')
            .sort({
                data_year: -1,
                unit_id: 1,
                indicator_id: 1
            });

        res.json({
            success: true,
            data: values
        });
    } catch (err) {
        console.error('Get indicator values error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const getValueById = async (req, res) => {
    try {
        const value = await IndicatorValue.findById(req.params.id)
            .populate('unit_id')
            .populate('indicator_id')
            .populate('updated_by', 'username full_name');
        if (!value) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi'
            });
        }
        res.json({
            success: true,
            data: value
        });
    } catch (err) {
        console.error('Get value error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const createValue = async (req, res) => {
    try {
        const {
            unit_id,
            indicator_id,
            data_year,
            year,
            raw_value,
            normalized_value
        } = req.body;
        const yr = parseInt(data_year || year);
        const data = {
            unit_id,
            indicator_id,
            data_year: yr,
            raw_value,
            normalized_value: normalized_value ?? raw_value / 100,
            updated_by: req.user._id,
        };
        const value = await IndicatorValue.create(data);
        await recomputeMinMaxNormalized(indicator_id, yr);
        const populated = await IndicatorValue.findById(value._id)
            .populate('unit_id', 'name')
            .populate('indicator_id', 'code name');
        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (err) {
        console.error('Create value error:', err);
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Đã tồn tại dữ liệu cho đơn vị + yếu tố + năm này',
            });
        }
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const updateValue = async (req, res) => {
    try {
        const {
            raw_value
        } = req.body;
        const value = await IndicatorValue.findById(req.params.id).populate('indicator_id', 'code');
        if (!value) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi'
            });
        }
        if (raw_value !== undefined) value.raw_value = raw_value;
        value.updated_by = req.user._id;
        await value.save();
        const indId = value.indicator_id?._id ?? value.indicator_id;
        const code = value.indicator_id?.code;
        if (indId) await recomputeMinMaxNormalized(indId, value.data_year);
        const populated = await IndicatorValue.findById(value._id)
            .populate('unit_id', 'name')
            .populate('indicator_id', 'code name')
            .populate('updated_by', 'username full_name');
        res.json({
            success: true,
            data: populated
        });
    } catch (err) {
        console.error('Update value error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const upsertValue = async (req, res) => {
    try {
        const {
            unit_id,
            indicator_id,
            data_year,
            year,
            raw_value
        } = req.body;
        const yr = parseInt(data_year || year);
        const filter = {
            unit_id,
            indicator_id,
            data_year: yr
        };
        const update = {
            raw_value,
            normalized_value: raw_value / 100,
            updated_by: req.user._id,
        };
        const value = await IndicatorValue.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
            runValidators: true,
        });
        await recomputeMinMaxNormalized(indicator_id, yr);
        const populated = await IndicatorValue.findById(value._id)
            .populate('unit_id', 'name')
            .populate('indicator_id', 'code name');
        res.json({
            success: true,
            data: populated
        });
    } catch (err) {
        console.error('Upsert value error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const deleteValue = async (req, res) => {
    try {
        const value = await IndicatorValue.findById(req.params.id);
        if (!value) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi'
            });
        }
        const indicatorId = value.indicator_id?.toString?.() ?? value.indicator_id;
        const dataYear = value.data_year;
        await IndicatorValue.findByIdAndDelete(req.params.id);
        await recomputeMinMaxNormalized(indicatorId, dataYear);
        res.json({
            success: true,
            message: 'Đã xóa'
        });
    } catch (err) {
        console.error('Delete value error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const bulkUpsert = async (req, res) => {
    try {
        const {
            items
        } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'items là mảng bắt buộc'
            });
        }
        const results = [];
        const groupsToRecompute = new Set();
        for (const it of items) {
            const {
                unit_id,
                indicator_id,
                data_year,
                year,
                raw_value
            } = it;
            const yr = parseInt(data_year || year);
            const filter = {
                unit_id,
                indicator_id,
                data_year: yr
            };
            const update = {
                raw_value,
                normalized_value: raw_value / 100,
                updated_by: req.user._id,
            };
            const value = await IndicatorValue.findOneAndUpdate(filter, update, {
                new: true,
                upsert: true,
                runValidators: true,
            });
            results.push(value);
            groupsToRecompute.add(`${indicator_id}|${yr}`);
        }
        for (const key of groupsToRecompute) {
            const [indicatorId, yr] = key.split('|');
            await recomputeMinMaxNormalized(indicatorId, parseInt(yr));
        }
        const populatedResults = await IndicatorValue.find({
                _id: {
                    $in: results.map((r) => r._id)
                }
            })
            .populate('unit_id', 'name')
            .populate('indicator_id', 'code name');
        res.json({
            success: true,
            data: populatedResults,
            count: populatedResults.length
        });
    } catch (err) {
        console.error('Bulk upsert error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getValues,
    getValueById,
    createValue,
    updateValue,
    upsertValue,
    deleteValue,
    bulkUpsert,
};
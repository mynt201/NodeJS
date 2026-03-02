const IndicatorValue = require('../models/IndicatorValue');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');

/**
 * GET /indicator-values/template?unit_id=xxx&year=2024|all
 * Trả về CSV mẫu: 1 phường, năm có thể 1 năm hoặc nhiều năm.
 * unit_id bắt buộc. year=all hoặc rỗng: nhiều năm (4 năm).
 */
const downloadTemplate = async (req, res) => {
    try {
        const unitIdParam = req.query.unit_id;
        const yearParam = req.query.year;
        const currentYear = new Date().getFullYear();

        if (!unitIdParam || unitIdParam === 'all') {
            return res.status(400).json({
                success: false,
                error: 'Chọn 1 phường để tải template',
            });
        }

        const isAllYears = !yearParam || yearParam === 'all';
        const wardAdminId = req.user?.role === 'WARD_ADMIN' && req.user.ward_id
            ? (req.user.ward_id.toString?.() || req.user.ward_id)
            : null;

        if (wardAdminId && unitIdParam !== wardAdminId) {
            return res.status(403).json({
                success: false,
                error: 'Quản lý phường chỉ được tải template cho phường của mình',
            });
        }

        const unit = await AdministrativeUnit.findById(unitIdParam).select('_id name').lean();
        if (!unit) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy phường' });
        }
        const units = [{ _id: unitIdParam, name: unit.name }];

        const years = isAllYears
            ? [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
            : [parseInt(yearParam) || currentYear];

        const indicators = await FloodIndicator.find({}).sort({ code: 1 }).select('code name unit').lean();
        const headerIndicators = indicators.map((i) => {
            const fullName = (i.name || i.code).trim();
            const unitStr = i.unit ? ` (${i.unit})` : '';
            return `${fullName} [${i.code}]${unitStr}`;
        });
        const headers = ['năm', ...headerIndicators];

        const rows = [];
        for (const y of years) {
            rows.push([
                y,
                ...indicators.map(() => '0'),
            ]);
        }

        const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const csvLines = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))];
        const bom = '\uFEFF';
        const safeFilename = `ChiSoRuiRo_Template.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.send(bom + csvLines.join('\n'));
    } catch (err) {
        console.error('Download template error:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi hệ thống khi tải template. Vui lòng thử lại sau.',
        });
    }
};

/**
 * Chuẩn hóa Min-Max theo direction của FloodIndicator:
 * - Thuận (direction=1): normalized = (giá trị − min) / (max − min) — càng cao càng rủi ro
 * - Nghịch (direction=0): normalized = (max − giá trị) / (max − min) — càng cao càng an toàn
 */
async function recomputeMinMaxNormalized(indicatorId, dataYear) {
    const indicator = await FloodIndicator.findById(indicatorId).select('code direction');
    if (!indicator) return;
    // direction=0 nghịch, direction=1 (hoặc undefined) thuận
    const isInverse = indicator.direction === 0;

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
            error: 'Lỗi hệ thống khi lấy danh sách chỉ số. Vui lòng thử lại sau.',
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
            error: 'Lỗi hệ thống khi lấy chi tiết chỉ số. Vui lòng thử lại sau.',
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
            normalized_value: 0.5, // placeholder, recomputeMinMaxNormalized sẽ ghi đè
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
            error: 'Lỗi hệ thống khi tạo chỉ số. Vui lòng thử lại sau.',
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
            error: 'Lỗi hệ thống khi cập nhật chỉ số. Vui lòng thử lại sau.',
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
            normalized_value: 0.5, // placeholder, recomputeMinMaxNormalized sẽ ghi đè
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
        if (req.user?.role === 'WARD_ADMIN' && req.user.ward_id) {
            const wardIdStr = req.user.ward_id.toString?.() || req.user.ward_id;
            const invalid = items.some((it) => (it.unit_id?.toString?.() || it.unit_id) !== wardIdStr);
            if (invalid) {
                return res.status(403).json({
                    success: false,
                    error: 'Quản lý phường chỉ được cập nhật dữ liệu cho phường của mình',
                });
            }
        }
        const sanitizeId = (id) => {
            if (id == null) return null;
            const s = String(id).trim().replace(/^"+|"+$/g, '');
            return s || null;
        };

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
            const cleanUnitId = sanitizeId(unit_id);
            const cleanIndicatorId = sanitizeId(indicator_id);
            const yr = parseInt(data_year || year, 10);
            if (!cleanUnitId || !cleanIndicatorId || isNaN(yr) || yr < 2000 || yr > 2100) {
                continue;
            }
            const filter = {
                unit_id: cleanUnitId,
                indicator_id: cleanIndicatorId,
                data_year: yr
            };
            const update = {
                raw_value,
                normalized_value: 0.5, // placeholder, recomputeMinMaxNormalized sẽ ghi đè
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
    downloadTemplate,
};
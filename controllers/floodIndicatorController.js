const FloodIndicator = require('../models/FloodIndicator');

const getIndicators = async (req, res) => {
    try {
        const filter = {};
        if (req.query.group_type) filter.group_type = req.query.group_type;
        if (req.query.code) filter.code = new RegExp(req.query.code, 'i');

        const indicators = await FloodIndicator.find(filter).sort({
            group_type: 1,
            code: 1
        });
        res.json({
            success: true,
            data: indicators
        });
    } catch (err) {
        console.error('Get indicators error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const getIndicatorById = async (req, res) => {
    try {
        const indicator = await FloodIndicator.findById(req.params.id);
        if (!indicator) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy yếu tố'
            });
        }
        res.json({
            success: true,
            data: indicator
        });
    } catch (err) {
        console.error('Get indicator error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const createIndicator = async (req, res) => {
    try {
        const indicator = await FloodIndicator.create(req.body);
        res.status(201).json({
            success: true,
            data: indicator
        });
    } catch (err) {
        console.error('Create indicator error:', err);
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Mã yếu tố đã tồn tại'
            });
        }
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const updateIndicator = async (req, res) => {
    try {
        const body = req.body || {};
        const allowed = ['name', 'group_type', 'weight', 'unit', 'description', 'direction'];
        const payload = {};
        for (const k of allowed) {
            if (Object.prototype.hasOwnProperty.call(body, k)) {
                if (k === 'direction') {
                    payload[k] = Number(body[k]) === 0 ? 0 : 1;
                } else {
                    payload[k] = body[k];
                }
            }
        }
        if (Object.keys(payload).length === 0) {
            console.warn('[updateIndicator] Body rỗng hoặc không có trường hợp lệ:', JSON.stringify(body));
            return res.status(400).json({
                success: false,
                error: 'Không có trường nào để cập nhật. Gửi name, group_type, unit, direction trong body JSON.',
            });
        }
        const indicator = await FloodIndicator.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true, runValidators: true }
        );
        if (!indicator) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy yếu tố'
            });
        }
        res.json({
            success: true,
            data: indicator
        });
    } catch (err) {
        console.error('Update indicator error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const deleteIndicator = async (req, res) => {
    try {
        const indicator = await FloodIndicator.findByIdAndDelete(req.params.id);
        if (!indicator) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy yếu tố'
            });
        }
        // Tự động tính lại trọng số AHP: phân bổ đều cho các chỉ số còn lại (tổng = 1)
        const remaining = await FloodIndicator.find({}).sort({ code: 1 }).lean();
        if (remaining.length > 0) {
            const weight = 1 / remaining.length;
            for (const ind of remaining) {
                await FloodIndicator.findByIdAndUpdate(ind._id, { weight });
            }
        }
        res.json({
            success: true,
            message: 'Đã xóa và cập nhật trọng số AHP cho các chỉ số còn lại'
        });
    } catch (err) {
        console.error('Delete indicator error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/** Cập nhật trọng số hàng loạt (sau AHP). Body: { items: [{ code: 'H', weight: 0.42 }, ...] } */
const updateWeights = async (req, res) => {
    try {
        const {
            items
        } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'items (array) là bắt buộc. Ví dụ: { "items": [{ "code": "H", "weight": 0.42 }] }',
            });
        }
        const results = [];
        for (const item of items) {
            const code = item && item.code ? String(item.code).toUpperCase().trim() : null;
            const weightVal = typeof (item && item.weight) === 'number' ? item.weight : parseFloat(item && item.weight);
            if (!code || Number.isNaN(weightVal) || weightVal < 0 || weightVal > 1) {
                continue;
            }
            const ind = await FloodIndicator.findOneAndUpdate({
                code
            }, {
                weight: weightVal
            }, {
                new: true
            });
            if (ind) results.push(ind);
        }
        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Không cập nhật được chỉ số nào. Kiểm tra code (H, T, P, POP, D) và weight (0–1).',
            });
        }
        res.json({
            success: true,
            data: results,
            message: `Đã cập nhật ${results.length} chỉ số`
        });
    } catch (err) {
        console.error('Update weights error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Lỗi server khi cập nhật trọng số'
        });
    }
};

module.exports = {
    getIndicators,
    getIndicatorById,
    createIndicator,
    updateIndicator,
    deleteIndicator,
    updateWeights,
};
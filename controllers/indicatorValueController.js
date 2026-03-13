const IndicatorValue = require('../models/IndicatorValue');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');
const IndicatorThreshold = require('../models/IndicatorThreshold');
const { parse } = require('csv-parse/sync');

/**
 * Tạo tiêu đề cột rõ ràng cho template: "Tên chỉ số [Mã] - Đơn vị"
 * @param {Array} indicators - Danh sách chỉ số từ DB
 * @param {boolean} includeWardColumn - Thêm cột "Phường/Xã" (cho template tất cả phường)
 */
function buildTemplateHeaderRow(indicators, includeWardColumn = false) {
    const yearHeader = 'Năm';
    const wardHeader = includeWardColumn ? ['Phường/Xã'] : [];
    const indicatorHeaders = indicators.map((i) => {
        const name = (i.name || i.code).trim();
        const unitPart = i.unit ? ` - ${i.unit}` : '';
        return `${name} [${i.code}]${unitPart}`;
    });
    return [yearHeader, ...wardHeader, ...indicatorHeaders];
}

/**
 * GET /indicator-values/template?unit_id=xxx|all&year=2024|all
 * - unit_id=all (chỉ SUPER_ADMIN): template tất cả phường & nhiều năm (cột Năm, Phường/Xã, chỉ số).
 * - unit_id=<id>: template 1 phường, nhiều năm (cột Năm, chỉ số).
 */
const downloadTemplate = async (req, res) => {
    try {
        const unitIdParam = (req.query.unit_id || '').toString().trim();
        const yearParam = req.query.year;
        const currentYear = new Date().getFullYear();
        const isAllUnits = !unitIdParam || unitIdParam.toLowerCase() === 'all';
        const wardAdminId = req.user?.role === 'WARD_ADMIN' && req.user.ward_id
            ? (req.user.ward_id.toString?.() || req.user.ward_id)
            : null;

        if (isAllUnits) {
            if (wardAdminId) {
                return res.status(403).json({
                    success: false,
                    error: 'Chỉ Super Admin mới được tải template tất cả phường. Bạn hãy chọn một phường để tải template.',
                });
            }
        } else {
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
        }

        const isAllYears = !yearParam || yearParam === 'all';
        const defaultYearRange = [2020, 2021, 2022, 2023, 2024, 2025];
        const yearRange = isAllYears ? defaultYearRange : [parseInt(yearParam) || currentYear];

        const indicators = await FloodIndicator.find({}).sort({ code: 1 }).select('code name unit').lean();
        const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;

        if (isAllUnits) {
            const units = await AdministrativeUnit.find({}).sort({ name: 1 }).select('_id name').lean();
            if (units.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Chưa có phường/xã nào. Thêm đơn vị hành chính trước khi tải template.',
                });
            }
            const headers = buildTemplateHeaderRow(indicators, true);
            const rows = [];
            for (const u of units) {
                for (const y of yearRange) {
                    rows.push([y, u.name, ...indicators.map(() => '0')]);
                }
            }
            const csvLines = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))];
            const bom = '\uFEFF';
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="Chi_so_rui_ro_Tat_ca_phuong_nam_Template.csv"');
            res.send(bom + csvLines.join('\n'));
            return;
        }

        const headers = buildTemplateHeaderRow(indicators, false);
        const rows = [];
        for (const y of yearRange) {
            rows.push([y, ...indicators.map(() => '0')]);
        }
        const csvLines = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))];
        const bom = '\uFEFF';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Chi_so_rui_ro_ngap_lut_Template.csv"');
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
 * Chuẩn hóa theo x_min, x_max từ bảng indicator_thresholds (theo từng phường + chỉ số).
 * Nếu có ngưỡng cho (unit_id, indicator_id): dùng x_min, x_max đó.
 * Nếu không có: fallback min/max từ toàn bộ raw_value cùng chỉ số + năm.
 * - Thuận (direction=1): normalized = (raw − min) / (max − min)
 * - Nghịch (direction=0): normalized = (max − raw) / (max − min)
 */
async function recomputeMinMaxNormalized(indicatorId, dataYear) {
    const indicator = await FloodIndicator.findById(indicatorId).select('code direction');
    if (!indicator) return;
    const isInverse = indicator.direction === 0;

    const values = await IndicatorValue.find({
        indicator_id: indicatorId,
        data_year: dataYear
    });
    if (values.length === 0) return;

    const thresholds = await IndicatorThreshold.find({ indicator_id: indicatorId })
        .select('unit_id x_min x_max')
        .lean();
    const thresholdByUnit = new Map();
    for (const t of thresholds) {
        const uid = (t.unit_id && t.unit_id._id ? t.unit_id._id : t.unit_id).toString();
        thresholdByUnit.set(uid, { x_min: t.x_min, x_max: t.x_max });
    }

    const rawValues = values.map((v) => v.raw_value);
    const groupMin = Math.min(...rawValues);
    const groupMax = Math.max(...rawValues);
    const groupRange = groupMax - groupMin;

    for (const v of values) {
        const unitIdStr = (v.unit_id && v.unit_id._id ? v.unit_id._id : v.unit_id).toString();
        const th = thresholdByUnit.get(unitIdStr);
        let min, max, range;
        if (th && th.x_min != null && th.x_max != null && th.x_max !== th.x_min) {
            min = th.x_min;
            max = th.x_max;
            range = max - min;
        } else {
            min = groupMin;
            max = groupMax;
            range = groupRange;
        }

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

/** Năm mặc định khi chưa có dữ liệu (template và dropdown). */
const DEFAULT_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

/**
 * GET /indicator-values/years?unit_id=xxx
 * Trả về danh sách năm có dữ liệu chỉ số (dynamic). Nếu chưa có data thì trả về 2020-2025.
 */
const getAvailableYears = async (req, res) => {
    try {
        const filter = {};
        if (req.query.unit_id && req.query.unit_id !== 'all') filter.unit_id = req.query.unit_id;
        const years = await IndicatorValue.distinct('data_year', filter);
        const sorted = (years || []).filter((y) => y >= 2000 && y <= 2100).sort((a, b) => b - a);
        const list = sorted.length > 0 ? sorted : DEFAULT_YEARS;
        res.json({ success: true, years: list });
    } catch (err) {
        console.error('Get available years error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

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

const sanitizeId = (id) => {
    if (id == null) return null;
    const s = String(id).trim().replace(/^"+|"+$/g, '');
    return s || null;
};

/** Thực hiện bulk upsert (dùng chung cho bulkUpsert và uploadCsv). */
async function doBulkUpsert(req, items) {
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error('items là mảng bắt buộc');
        err.statusCode = 400;
        throw err;
    }
    if (req.user?.role === 'WARD_ADMIN' && req.user.ward_id) {
        const wardIdStr = req.user.ward_id.toString?.() || req.user.ward_id;
        const invalid = items.some((it) => (it.unit_id?.toString?.() || it.unit_id) !== wardIdStr);
        if (invalid) {
            const err = new Error('Quản lý phường chỉ được cập nhật dữ liệu cho phường của mình');
            err.statusCode = 403;
            throw err;
        }
    }
    const results = [];
    const groupsToRecompute = new Set();
    for (const it of items) {
        const { unit_id, indicator_id, data_year, year, raw_value } = it;
        const cleanUnitId = sanitizeId(unit_id);
        const cleanIndicatorId = sanitizeId(indicator_id);
        const yr = parseInt(data_year || year, 10);
        if (!cleanUnitId || !cleanIndicatorId || isNaN(yr) || yr < 2000 || yr > 2100) continue;
        const filter = { unit_id: cleanUnitId, indicator_id: cleanIndicatorId, data_year: yr };
        const update = {
            raw_value,
            normalized_value: 0.5,
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
    const populatedResults = await IndicatorValue.find({ _id: { $in: results.map((r) => r._id) } })
        .populate('unit_id', 'name')
        .populate('indicator_id', 'code name');
    return { success: true, data: populatedResults, count: populatedResults.length };
}

const bulkUpsert = async (req, res) => {
    try {
        const { items } = req.body;
        const result = await doBulkUpsert(req, items);
        res.json(result);
    } catch (err) {
        console.error('Bulk upsert error:', err);
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Lỗi khi cập nhật dữ liệu',
        });
    }
};

/** Bí danh tên cột thường gặp khi import (độ dốc địa hình, lượng mưa, ...) */
const HEADER_ALIASES_BY_CODE = {
    H: ['độ dốc địa hình', 'địa hình', 'terrain slope', 'elevation', 'độ cao'],
    P: ['lượng mưa (m3/s)', 'lượng mưa', 'rainfall', 'mưa (mm)', 'precipitation'],
    T: ['triều cường', 'tide'],
    D: ['mật độ cống', 'drainage', 'cống'],
    POP: ['dân số', 'population', 'mật độ dân'],
};

/**
 * Parse số từ ô CSV: hỗ trợ dấu phẩy thập phân (1,5 → 1.5), trim, trả về NaN nếu không hợp lệ.
 */
function parseNumberFromCell(cell) {
    if (cell == null) return NaN;
    let s = String(cell).trim().replace(/\s+/g, '');
    if (s === '' || s === '-') return NaN;
    s = s.replace(/,/g, '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
}

/**
 * Map header CSV (dynamic) sang chỉ số: tìm cột chứa [code], tên chỉ số, hoặc bí danh.
 */
function mapHeadersToIndicators(rawHeaders, indicators) {
    const trimLower = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const headers = rawHeaders.map((h) => trimLower(h));
    let yearIdx = headers.findIndex((h) => h.includes('năm') || h.includes('year'));
    if (yearIdx < 0) yearIdx = 0;
    const codeToId = Object.fromEntries(indicators.map((i) => [i.code, i._id.toString()]));
    const indexByCode = {};
    const used = new Set();
    if (yearIdx >= 0) used.add(yearIdx);

    for (const ind of indicators) {
        const code = ind.code;
        const namePart = (ind.name || code).trim().toLowerCase();
        let idx = -1;
        for (let i = 0; i < rawHeaders.length; i++) {
            if (used.has(i)) continue;
            const h = trimLower(rawHeaders[i]);
            if (h.includes(`[${code.toLowerCase()}]`) || h.includes(`[${code}]`)) {
                idx = i;
                break;
            }
            if (namePart.length >= 2 && (h === namePart || h.includes(namePart))) {
                idx = i;
                break;
            }
            const aliases = HEADER_ALIASES_BY_CODE[code];
            if (aliases && aliases.some((a) => h.includes(a))) {
                idx = i;
                break;
            }
        }
        if (idx >= 0) {
            indexByCode[code] = { index: idx, indicator_id: ind._id.toString() };
            used.add(idx);
        }
    }
    return { yearIdx, indexByCode, codeToId };
}

/** Tìm chỉ số cột "Phường/Xã" (hoặc tương đương) để import nhiều đơn vị trong một file. */
function findWardColumnIndex(rawHeaders) {
    const trimLower = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const labels = ['phường/xã', 'phường xã', 'phuong/xa', 'ward', 'đơn vị', 'don vi', 'tên phường', 'ten phuong'];
    for (let i = 0; i < rawHeaders.length; i++) {
        const h = trimLower(rawHeaders[i]);
        if (labels.some((l) => h.includes(l) || h === l)) return i;
    }
    return -1;
}

/** Chuẩn hóa tên phường để so khớp (lowercase, trim, 1 space). */
function normalizeWardName(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Bỏ dấu tiếng Việt để so khớp linh hoạt (An Phu vs An Phú). */
function removeVietnameseTone(str) {
    const from = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
    const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
    let out = (str || '').toLowerCase();
    for (let i = 0; i < from.length; i++) out = out.replace(new RegExp(from[i], 'g'), to[i]);
    return out.replace(/\s+/g, ' ').trim();
}

/**
 * POST /indicator-values/upload-csv
 * Body: multipart/form-data với file (CSV). unit_id tùy chọn nếu file có cột "Phường/Xã".
 * - Có cột "Phường/Xã": import nhiều phường/xã trong một file (khớp tên với DB).
 * - Không có: bắt buộc unit_id (một phường).
 * Map cột: "độ dốc địa hình" -> H, "lượng mưa (m3/s)" -> P, v.v.
 */
const uploadCsv = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng chọn file CSV để tải lên',
            });
        }
        const unitIdBody = (req.body && req.body.unit_id) ? String(req.body.unit_id).trim() : '';
        const wardAdminId = req.user?.role === 'WARD_ADMIN' && req.user.ward_id
            ? (req.user.ward_id.toString?.() || req.user.ward_id)
            : null;

        const indicators = await FloodIndicator.find({}).sort({ code: 1 }).select('_id code name unit').lean();
        if (indicators.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Chưa có chỉ số nào trong hệ thống. Vui lòng cấu hình tại Quản lý chỉ số.',
            });
        }

        const raw = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '');
        const delimiter = raw.includes(';') && raw.split(';').length >= raw.split(',').length ? ';' : ',';
        const records = parse(raw, {
            bom: true,
            skip_empty_lines: true,
            relax_column_count: true,
            delimiter,
            trim: true,
        });

        if (!Array.isArray(records) || records.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'File CSV không có dữ liệu hoặc thiếu dòng tiêu đề',
            });
        }

        const rawHeaders = records[0];
        const wardColIdx = findWardColumnIndex(rawHeaders);
        const singleUnitId = unitIdBody || null;

        if (wardColIdx < 0 && !singleUnitId) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu unit_id (chọn một phường/xã) hoặc file CSV phải có cột "Phường/Xã" để import nhiều đơn vị.',
            });
        }

        if (wardColIdx < 0 && singleUnitId) {
            if (wardAdminId && singleUnitId !== wardAdminId) {
                return res.status(403).json({
                    success: false,
                    error: 'Quản lý phường chỉ được tải lên dữ liệu cho phường của mình',
                });
            }
            const unit = await AdministrativeUnit.findById(singleUnitId).select('_id name').lean();
            if (!unit) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy phường/xã với mã đã chọn' });
            }
        }

        let unitNameToId = null;
        if (wardColIdx >= 0) {
            const units = await AdministrativeUnit.find({}).select('_id name').lean();
            unitNameToId = new Map();
            for (const u of units) {
                const idStr = u._id.toString();
                const key = normalizeWardName(u.name);
                if (key) {
                    unitNameToId.set(key, idStr);
                    const keyNoTone = removeVietnameseTone(key);
                    if (keyNoTone && keyNoTone !== key) unitNameToId.set(keyNoTone, idStr);
                }
            }
            if (unitNameToId.size === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Hệ thống chưa có đơn vị hành chính nào. Không thể khớp cột "Phường/Xã".',
                });
            }
        }

        const { yearIdx, indexByCode } = mapHeadersToIndicators(rawHeaders, indicators);
        const codesWithColumn = Object.keys(indexByCode);
        if (codesWithColumn.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Không nhận diện được cột chỉ số nào. Cần ít nhất một cột như: Năm, Phường/Xã, độ dốc địa hình, lượng mưa (m3/s), hoặc tên chỉ số [Mã].',
            });
        }
        const items = [];
        const skippedNoWard = { count: 0 };
        const skippedInvalidYear = { count: 0 };
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            const yearCell = row[yearIdx];
            const yearVal = parseInt(String(yearCell != null ? yearCell : '').trim(), 10);
            if (isNaN(yearVal) || yearVal < 2000 || yearVal > 2100) {
                skippedInvalidYear.count++;
                continue;
            }
            const year = yearVal;

            let unitId = singleUnitId;
            if (wardColIdx >= 0 && unitNameToId) {
                const wardName = normalizeWardName(row[wardColIdx]);
                unitId = unitNameToId.get(wardName) || unitNameToId.get(removeVietnameseTone(wardName)) || null;
                if (!unitId) {
                    skippedNoWard.count++;
                    continue;
                }
            }
            if (wardAdminId && unitId !== wardAdminId) continue;

            for (const code of codesWithColumn) {
                const { index, indicator_id } = indexByCode[code];
                const cell = index < row.length ? row[index] : undefined;
                const rawVal = parseNumberFromCell(cell);
                const value = Number.isFinite(rawVal) ? Math.max(0, rawVal) : 0;
                items.push({
                    unit_id: unitId,
                    indicator_id,
                    data_year: year,
                    raw_value: value,
                });
            }
        }

        if (items.length === 0) {
            const parts = [];
            if (skippedNoWard.count > 0) parts.push(`${skippedNoWard.count} dòng không khớp tên phường/xã`);
            if (skippedInvalidYear.count > 0) parts.push(`${skippedInvalidYear.count} dòng có năm không hợp lệ (2000–2100)`);
            const msg = parts.length > 0
                ? `Không có dòng nào hợp lệ. Đã bỏ qua: ${parts.join('; ')}. Kiểm tra cột Năm và Phường/Xã.`
                : 'Không có dòng dữ liệu hợp lệ trong file CSV. Cần ít nhất một dòng có năm hợp lệ (2000–2100).';
            return res.status(400).json({ success: false, error: msg });
        }

        const result = await doBulkUpsert(req, items);
        const extraParts = [];
        if (skippedNoWard.count > 0) extraParts.push(`${skippedNoWard.count} dòng không khớp phường/xã`);
        if (skippedInvalidYear.count > 0) extraParts.push(`${skippedInvalidYear.count} dòng năm không hợp lệ`);
        const extra = extraParts.length > 0 ? ` (đã bỏ qua: ${extraParts.join('; ')})` : '';
        res.json({
            ...result,
            message: `Đã import ${result.count} bản ghi chỉ số.${extra}`,
        });
    } catch (err) {
        console.error('Upload CSV error:', err);
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Lỗi khi xử lý file CSV',
        });
    }
};

module.exports = {
    getValues,
    getValueById,
    getAvailableYears,
    createValue,
    updateValue,
    upsertValue,
    deleteValue,
    bulkUpsert,
    downloadTemplate,
    uploadCsv,
};
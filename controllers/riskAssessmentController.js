const RiskAssessment = require('../models/RiskAssessment');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');
const IndicatorValue = require('../models/IndicatorValue');

const getAssessments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.unit_id) filter.unit_id = req.query.unit_id;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.risk_level) filter.risk_level = req.query.risk_level;

    const assessments = await RiskAssessment.find(filter)
      .populate('unit_id', 'name geom area_km2')
      .sort({ year: -1, total_score: -1 });

    res.json({ success: true, data: assessments });
  } catch (err) {
    console.error('Get assessments error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const assessments = await RiskAssessment.find({ year })
      .populate('unit_id', 'name geom area_km2')
      .sort({ total_score: -1 });

    res.json({ success: true, data: assessments, year });
  } catch (err) {
    console.error('Get by year error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getAssessmentById = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id).populate('unit_id');
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createAssessment = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.risk_score !== undefined && body.total_score === undefined) body.total_score = body.risk_score;
    delete body.risk_score;
    const assessment = await RiskAssessment.create(body);
    const populated = await RiskAssessment.findById(assessment._id).populate('unit_id', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Create assessment error:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Đã tồn tại đánh giá cho đơn vị + năm này',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('unit_id', 'name');

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Update assessment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    console.error('Delete assessment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const upsertAssessment = async (req, res) => {
  try {
    const { unit_id, year, total_score, risk_score, risk_level } = req.body;
    const filter = { unit_id, year: parseInt(year) };
    const update = { total_score: total_score ?? risk_score, risk_level };
    const assessment = await RiskAssessment.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      runValidators: true,
    }).populate('unit_id', 'name geom');
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Upsert assessment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const bulkUpsert = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items là mảng bắt buộc' });
    }
    const results = [];
    for (const it of items) {
      const { unit_id, year, total_score, risk_score, risk_level } = it;
      const filter = { unit_id, year: parseInt(year) };
      const update = { total_score: total_score ?? risk_score, risk_level };
      const assessment = await RiskAssessment.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        runValidators: true,
      });
      results.push(assessment);
    }
    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    console.error('Bulk upsert assessment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/** Phân cấp rủi ro từ RI (0-1) */
function getRiskLevelFromScore(ri) {
  if (ri < 0.2) return 'Rất thấp';
  if (ri < 0.4) return 'Thấp';
  if (ri < 0.6) return 'Trung bình';
  if (ri < 0.8) return 'Cao';
  return 'Rất cao';
}

/** Bước 3: Tính RI = Σ(weight_i × normalized_value_i) và cập nhật risk_assessments */
const refreshAssessments = async (req, res) => {
  try {
    const year = parseInt(req.query.year || req.body?.year || new Date().getFullYear());
    const units = await AdministrativeUnit.find({}).select('_id name');
    const indicators = await FloodIndicator.find({}).select('_id code weight').lean();
    if (indicators.length === 0) {
      return res.status(400).json({ success: false, error: 'Chưa có flood_indicators. Chạy seed trước.' });
    }
    const indicatorIds = indicators.map((i) => i._id);
    const values = await IndicatorValue.find({
      data_year: year,
      indicator_id: { $in: indicatorIds },
    }).lean();
    const unitIndicatorNorm = {};
    for (const v of values) {
      const uid = (v.unit_id && v.unit_id.toString) ? v.unit_id.toString() : String(v.unit_id);
      const iid = (v.indicator_id && v.indicator_id.toString) ? v.indicator_id.toString() : String(v.indicator_id);
      if (!uid || !iid) continue;
      if (!unitIndicatorNorm[uid]) unitIndicatorNorm[uid] = {};
      unitIndicatorNorm[uid][iid] = v.normalized_value ?? 0;
    }
    const results = [];
    for (const unit of units) {
      const uid = unit._id.toString();
      const norms = unitIndicatorNorm[uid] || {};
      let totalScore = 0;
      for (const ind of indicators) {
        const iid = ind._id.toString();
        const w = ind.weight ?? 0;
        const n = norms[iid] ?? 0;
        totalScore += w * n;
      }
      const riskLevel = getRiskLevelFromScore(totalScore);
      const a = await RiskAssessment.findOneAndUpdate(
        { unit_id: unit._id, year },
        { total_score: totalScore, risk_level: riskLevel },
        { new: true, upsert: true, runValidators: true }
      ).populate('unit_id', 'name');
      results.push(a);
    }
    res.json({
      success: true,
      data: results,
      count: results.length,
      year,
      message: `Đã tính và cập nhật ${results.length} đánh giá rủi ro cho năm ${year}`,
    });
  } catch (err) {
    console.error('Refresh assessments error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const stats = await RiskAssessment.aggregate([
      { $match: { year } },
      { $group: { _id: '$risk_level', count: { $sum: 1 } } },
    ]);
    const distribution = stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const total = await RiskAssessment.countDocuments({ year });
    res.json({
      success: true,
      data: { year, total, distribution },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAssessments,
  getByYear,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  upsertAssessment,
  bulkUpsert,
  getStats,
  refreshAssessments,
};

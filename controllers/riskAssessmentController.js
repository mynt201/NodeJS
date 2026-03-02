const RiskAssessment = require('../models/RiskAssessment');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');
const IndicatorValue = require('../models/IndicatorValue');

const getAssessments = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      filter.unit_id = req.user.ward_id;
    } else if (req.query.unit_id) {
      filter.unit_id = req.query.unit_id;
    }
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.risk_level) filter.risk_level = req.query.risk_level;

    const assessments = await RiskAssessment.find(filter)
      .populate('unit_id', 'name geom area_km2')
      .sort({ year: -1, total_score: -1 });

    res.json({ success: true, data: assessments });
  } catch (err) {
    console.error('Get assessments error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lấy danh sách đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const getByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const filter = { year };
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      filter.unit_id = req.user.ward_id;
    }
    const assessments = await RiskAssessment.find(filter)
      .populate('unit_id', 'name geom area_km2')
      .sort({ total_score: -1 });

    res.json({ success: true, data: assessments, year });
  } catch (err) {
    console.error('Get by year error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lấy đánh giá theo năm. Vui lòng thử lại sau.',
    });
  }
};

const getAssessmentById = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id).populate('unit_id');
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      const assessmentUnitId = (assessment.unit_id?._id || assessment.unit_id)?.toString?.();
      if (assessmentUnitId !== req.user.ward_id.toString()) {
        return res.status(403).json({ success: false, error: 'Chỉ được xem đánh giá phường của mình' });
      }
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lấy chi tiết đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const createAssessment = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      if (body.unit_id?.toString() !== req.user.ward_id.toString()) {
        return res.status(403).json({ success: false, error: 'Chỉ được tạo đánh giá cho phường của mình' });
      }
    }
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
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi tạo đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const existing = await RiskAssessment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      const unitId = (existing.unit_id?.toString?.() || existing.unit_id)?.toString?.();
      if (unitId !== req.user.ward_id.toString()) {
        return res.status(403).json({ success: false, error: 'Chỉ được sửa đánh giá phường của mình' });
      }
    }
    const assessment = await RiskAssessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('unit_id', 'name');
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Update assessment error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi cập nhật đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const existing = await RiskAssessment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả đánh giá' });
    }
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      const unitId = (existing.unit_id?.toString?.() || existing.unit_id)?.toString?.();
      if (unitId !== req.user.ward_id.toString()) {
        return res.status(403).json({ success: false, error: 'Chỉ được xóa đánh giá phường của mình' });
      }
    }
    await RiskAssessment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    console.error('Delete assessment error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi xóa đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const upsertAssessment = async (req, res) => {
  try {
    const { unit_id, year, total_score, risk_score, risk_level } = req.body;
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      if (unit_id?.toString() !== req.user.ward_id.toString()) {
        return res.status(403).json({ success: false, error: 'Chỉ được cập nhật đánh giá phường của mình' });
      }
    }
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
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lưu đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const bulkUpsert = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items là mảng bắt buộc' });
    }
    const wardIdStr = req.user?.role === 'WARD_ADMIN' && req.user?.ward_id
      ? req.user.ward_id.toString()
      : null;
    if (wardIdStr) {
      const invalid = items.some((it) => (it.unit_id?.toString?.() || it.unit_id) !== wardIdStr);
      if (invalid) {
        return res.status(403).json({ success: false, error: 'Quản lý phường chỉ được cập nhật đánh giá phường của mình' });
      }
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
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lưu danh sách đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Bước 5: Phân cấp rủi ro (Risk Level)
 * total_score ∈ [0, 1] → 3 mức độ định tính:
 * - Thấp (< 0.34): Vùng an toàn
 * - Trung bình (0.34 - 0.66): Vùng có nguy cơ
 * - Cao (> 0.66): Vùng nguy hiểm
 */
function getRiskLevelFromScore(ri) {
  if (ri < 0.34) return 'Thấp';
  if (ri <= 0.66) return 'Trung bình';
  return 'Cao';
}

/**
 * Bước 4: Tính điểm rủi ro tổng hợp (Total Score)
 * Công thức: total_score = Σ(weight × normalized_value)
 * Kết quả: Mỗi phường có số thập phân trong khoảng [0, 1]
 */
const refreshAssessments = async (req, res) => {
  try {
    const year = parseInt(req.query.year || req.body?.year || new Date().getFullYear());
    const unitFilter = {};
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      unitFilter._id = req.user.ward_id;
    }
    const units = await AdministrativeUnit.find(unitFilter).select('_id name');
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
      totalScore = Math.max(0, Math.min(1, totalScore));
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
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi tính lại đánh giá rủi ro. Vui lòng thử lại sau.',
    });
  }
};

const getStats = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const matchFilter = { year };
    if (req.user?.role === 'WARD_ADMIN' && req.user?.ward_id) {
      matchFilter.unit_id = req.user.ward_id;
    }
    const stats = await RiskAssessment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$risk_level', count: { $sum: 1 } } },
    ]);
    const distribution = stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const total = await RiskAssessment.countDocuments(matchFilter);
    res.json({
      success: true,
      data: { year, total, distribution },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi lấy thống kê rủi ro. Vui lòng thử lại sau.',
    });
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

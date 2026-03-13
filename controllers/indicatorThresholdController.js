const IndicatorThreshold = require("../models/IndicatorThreshold");

/**
 * GET /api/indicator-thresholds
 * Query: unit_id?, indicator_id?
 */
async function getList(req, res) {
  try {
    const { unit_id, indicator_id } = req.query;
    const filter = {};
    if (unit_id) filter.unit_id = unit_id;
    if (indicator_id) filter.indicator_id = indicator_id;

    const list = await IndicatorThreshold.find(filter)
      .populate("unit_id", "name")
      .populate("indicator_id", "code name")
      .sort({ unit_id: 1, indicator_id: 1 })
      .lean();
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error("indicatorThreshold getList:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/indicator-thresholds/:id
 */
async function getById(req, res) {
  try {
    const doc = await IndicatorThreshold.findById(req.params.id)
      .populate("unit_id", "name")
      .populate("indicator_id", "code name")
      .lean();
    if (!doc) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("indicatorThreshold getById:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/indicator-thresholds
 * Body: { indicator_id, unit_id, x_min, x_max, unit? }
 */
async function create(req, res) {
  try {
    const { indicator_id, unit_id, x_min, x_max, unit } = req.body;
    const doc = await IndicatorThreshold.create({
      indicator_id,
      unit_id,
      x_min: x_min != null ? Number(x_min) : 0.8,
      x_max: x_max != null ? Number(x_max) : 2.0,
      unit: unit != null ? String(unit).trim() : "",
    });
    const populated = await IndicatorThreshold.findById(doc._id)
      .populate("unit_id", "name")
      .populate("indicator_id", "code name")
      .lean();
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Ngưỡng cho cặp chỉ số + phường này đã tồn tại.",
      });
    }
    console.error("indicatorThreshold create:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * PUT /api/indicator-thresholds/:id
 * Body: { x_min?, x_max?, unit? }
 */
async function update(req, res) {
  try {
    const { x_min, x_max, unit } = req.body;
    const updateFields = {};
    if (x_min != null) updateFields.x_min = Number(x_min);
    if (x_max != null) updateFields.x_max = Number(x_max);
    if (unit !== undefined) updateFields.unit = String(unit).trim();

    const doc = await IndicatorThreshold.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("unit_id", "name")
      .populate("indicator_id", "code name")
      .lean();
    if (!doc) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("indicatorThreshold update:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/indicator-thresholds/:id
 */
async function remove(req, res) {
  try {
    const doc = await IndicatorThreshold.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("indicatorThreshold remove:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getList,
  getById,
  create,
  update,
  remove,
};

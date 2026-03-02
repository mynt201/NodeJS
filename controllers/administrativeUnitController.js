const AdministrativeUnit = require('../models/AdministrativeUnit');

const getUnits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.name) filter.name = new RegExp(req.query.name, 'i');

    const units = await AdministrativeUnit.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await AdministrativeUnit.countDocuments(filter);

    res.json({
      success: true,
      data: units,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get units error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getAllUnits = async (req, res) => {
  try {
    const units = await AdministrativeUnit.find({}).sort({ name: 1 }).select('-__v');
    res.json({ success: true, data: units });
  } catch (err) {
    console.error('Get all units error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getUnitById = async (req, res) => {
  try {
    const unit = await AdministrativeUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn vị hành chính' });
    }
    res.json({ success: true, data: unit });
  } catch (err) {
    console.error('Get unit by ID error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createUnit = async (req, res) => {
  try {
    const { name, geom, area_km2 } = req.body;
    const existing = await AdministrativeUnit.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Tên phường đã tồn tại' });
    }
    const unit = await AdministrativeUnit.create({ name, geom, area_km2: area_km2 || 0 });
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    console.error('Create unit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const unit = await AdministrativeUnit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!unit) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn vị hành chính' });
    }
    res.json({ success: true, data: unit });
  } catch (err) {
    console.error('Update unit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const unit = await AdministrativeUnit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn vị hành chính' });
    }
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    console.error('Delete unit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getUnits,
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
};

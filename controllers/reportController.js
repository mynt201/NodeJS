const path = require('path');
const RiskAssessment = require('../models/RiskAssessment');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const FloodIndicator = require('../models/FloodIndicator');
const IndicatorValue = require('../models/IndicatorValue');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const FONT_PATH = path.join(__dirname, '../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf');

const getUnitFilter = (req) => {
  if (req.user?.role === 'WARD_ADMIN') {
    if (!req.user?.ward_id) {
      throw new Error('WARD_ADMIN chưa được gán phường. Liên hệ Super Admin.');
    }
    return { unit_id: req.user.ward_id };
  }
  return {};
};

/**
 * GET /api/reports/dashboard?year=2024
 * Super Admin: tất cả phường | Ward Admin: chỉ phường của mình
 */
const getDashboardData = async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const unitFilter = getUnitFilter(req);
    const assessments = await RiskAssessment.find({ year, ...unitFilter })
      .populate('unit_id', 'name area_km2')
      .sort({ total_score: -1 })
      .lean();

    const distribution = { Cao: 0, 'Trung bình': 0, Thấp: 0 };
    const wards = assessments.map((a) => {
      const level = a.risk_level || 'Thấp';
      if (distribution[level] !== undefined) distribution[level]++;
      return {
        _id: a.unit_id?._id?.toString(),
        ward_name: a.unit_id?.name || '—',
        total_score: a.total_score,
        risk_level: a.risk_level,
      };
    });

    const total = wards.length;
    res.json({
      success: true,
      data: {
        year,
        total,
        distribution,
        wards,
        highRisk: distribution.Cao,
        mediumRisk: distribution['Trung bình'],
        lowRisk: distribution.Thấp,
        isWardAdmin: req.user?.role === 'WARD_ADMIN',
      },
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/reports/compare?year1=2024&year2=2025
 * Super Admin: so sánh tổng hợp theo mức | Ward Admin: so sánh phường của mình giữa 2 năm
 */
const getCompareYears = async (req, res) => {
  try {
    const year1 = parseInt(req.query.year1 || new Date().getFullYear());
    const year2 = parseInt(req.query.year2 || year1 - 1);
    const unitFilter = getUnitFilter(req);

    // Ward Admin: so sánh 1 phường giữa 2 năm
    if (unitFilter.unit_id) {
      const [a1, a2] = await Promise.all([
        RiskAssessment.findOne({ year: year1, ...unitFilter }).populate('unit_id', 'name').lean(),
        RiskAssessment.findOne({ year: year2, ...unitFilter }).populate('unit_id', 'name').lean(),
      ]);
      const wardName = a1?.unit_id?.name || a2?.unit_id?.name || '—';
      res.json({
        success: true,
        data: {
          year1,
          year2,
          isWardAdmin: true,
          wardCompare: {
            ward_name: wardName,
            year1: a1 ? { total_score: a1.total_score, risk_level: a1.risk_level } : null,
            year2: a2 ? { total_score: a2.total_score, risk_level: a2.risk_level } : null,
          },
        },
      });
      return;
    }

    // Super Admin: tổng hợp theo mức
    const [data1, data2] = await Promise.all([
      RiskAssessment.aggregate([{ $match: { year: year1 } }, { $group: { _id: '$risk_level', count: { $sum: 1 } } }]),
      RiskAssessment.aggregate([{ $match: { year: year2 } }, { $group: { _id: '$risk_level', count: { $sum: 1 } } }]),
    ]);

    const toMap = (arr) => arr.reduce((acc, x) => ({ ...acc, [x._id]: x.count }), {});
    const d1 = toMap(data1);
    const d2 = toMap(data2);

    const levels = ['Cao', 'Trung bình', 'Thấp'];
    const comparison = levels.map((l) => ({
      level: l,
      year1: d1[l] || 0,
      year2: d2[l] || 0,
      change: ((d1[l] || 0) - (d2[l] || 0)),
    }));

    res.json({
      success: true,
      data: { year1, year2, comparison, isWardAdmin: false },
    });
  } catch (err) {
    console.error('getCompareYears error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/reports/export/excel?year=2024
 * Super Admin: tất cả phường | Ward Admin: chỉ phường của mình
 */
const exportExcel = async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const unitFilter = getUnitFilter(req);
    const indicators = await FloodIndicator.find({}).sort({ code: 1 }).select('code name unit').lean();
    const units = unitFilter.unit_id
      ? await AdministrativeUnit.find({ _id: unitFilter.unit_id }).select('_id name').lean()
      : await AdministrativeUnit.find({}).select('_id name').lean();
    const assessments = await RiskAssessment.find({ year, ...unitFilter }).populate('unit_id', 'name').lean();
    const indicatorFilter = unitFilter.unit_id ? { ...unitFilter, data_year: year } : { data_year: year };
    const indicatorValues = await IndicatorValue.find(indicatorFilter)
      .populate('unit_id', 'name')
      .populate('indicator_id', 'code name unit')
      .lean();

    const unitToAssessment = {};
    assessments.forEach((a) => {
      const uid = a.unit_id?._id?.toString?.() || a.unit_id?.toString?.();
      if (uid) unitToAssessment[uid] = a;
    });

    const unitToIndicators = {};
    indicatorValues.forEach((v) => {
      const uid = v.unit_id?._id?.toString?.() || v.unit_id?.toString?.();
      const code = v.indicator_id?.code || '?';
      if (!uid) return;
      if (!unitToIndicators[uid]) unitToIndicators[uid] = {};
      unitToIndicators[uid][code] = v.raw_value ?? 0;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Báo cáo ${year}`, { views: [{ state: 'frozen', ySplit: 1 }] });

    const headers = ['STT', 'Tên phường', ...indicators.map((i) => `${i.code} (${i.unit || ''})`), 'R (total_score)', 'Mức độ rủi ro'];
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    units.forEach((unit, idx) => {
      const uid = unit._id.toString();
      const a = unitToAssessment[uid];
      const inds = unitToIndicators[uid] || {};
      const row = [
        idx + 1,
        unit.name,
        ...indicators.map((i) => inds[i.code] ?? '—'),
        a ? (a.total_score ?? '—') : '—',
        a ? (a.risk_level ?? '—') : 'Chưa có dữ liệu',
      ];
      sheet.addRow(row);
    });

    sheet.columns.forEach((col, i) => col.width = i === 1 ? 25 : 14);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_rui_ro_${year}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportExcel error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/reports/export/pdf?year=2024
 * Super Admin: báo cáo tổng hợp | Ward Admin: chỉ phường của mình
 */
const exportPDF = async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const unitFilter = getUnitFilter(req);
    const assessments = await RiskAssessment.find({ year, ...unitFilter })
      .populate('unit_id', 'name')
      .sort({ total_score: -1 })
      .limit(unitFilter.unit_id ? 1 : 34)
      .lean();

    const top5 = assessments.filter((a) => a.risk_level === 'Cao').slice(0, unitFilter.unit_id ? 1 : 5);
    const distribution = { Cao: 0, 'Trung bình': 0, Thấp: 0 };
    assessments.forEach((a) => {
      if (distribution[a.risk_level] !== undefined) distribution[a.risk_level]++;
    });

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('DejaVuSans', FONT_PATH);
    doc.font('DejaVuSans');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_rui_ro_${year}.pdf"`);
    doc.pipe(res);

    const isWardReport = !!unitFilter.unit_id;
    doc.fontSize(20).text('BÁO CÁO RỦI RO NGẬP LỤT', { align: 'center' });
    doc.fontSize(14).text(
      isWardReport ? `Phường ${assessments[0]?.unit_id?.name || '—'} - Năm ${year}` : `Thành phố Thủ Đức - Năm ${year}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    doc.fontSize(12).text('Tổng quan:', { continued: false });
    if (isWardReport) {
      const a = assessments[0];
      doc.text(`  • Phường: ${a?.unit_id?.name || '—'}`);
      doc.text(`  • Điểm R: ${a ? (a.total_score ?? 0).toFixed(2) : '—'}`);
      doc.text(`  • Mức độ rủi ro: ${a?.risk_level || '—'}`);
    } else {
      doc.text(`  • Tổng số phường: ${assessments.length}`);
      doc.text(`  • Phường nguy hiểm (Cao): ${distribution.Cao}`);
      doc.text(`  • Phường trung bình: ${distribution['Trung bình']}`);
      doc.text(`  • Phường an toàn (Thấp): ${distribution.Thấp}`);
    }
    doc.moveDown();

    if (!isWardReport) {
      doc.fontSize(12).text('Biểu đồ tỷ lệ: Tỷ lệ % 3 mức rủi ro (Thấp, Trung bình, Cao)', { continued: false });
      const total = assessments.length || 1;
      doc.text(`  - Thấp: ${((distribution.Thấp / total) * 100).toFixed(1)}%`);
      doc.text(`  - Trung bình: ${((distribution['Trung bình'] / total) * 100).toFixed(1)}%`);
      doc.text(`  - Cao: ${((distribution.Cao / total) * 100).toFixed(1)}%`);
      doc.moveDown();
    }

    doc.fontSize(12).text(
      isWardReport ? 'Thông tin phường quản lý:' : '5 phường có nguy cơ cao nhất cần ưu tiên nguồn lực:',
      { continued: false }
    );
    (top5.length ? top5 : assessments.slice(0, 5)).forEach((a, i) => {
      doc.text(`  ${i + 1}. ${a.unit_id?.name || '—'} - Điểm: ${(a.total_score ?? 0).toFixed(2)} - ${a.risk_level}`);
    });
    doc.moveDown();

    doc.fontSize(11).text('Bản đồ phân vùng: Xem bản đồ GIS tại trang Web để xem ranh giới các vùng màu xanh, vàng, đỏ.', { continued: false });
    doc.moveDown();
    doc.fontSize(10).text(`Báo cáo được tạo lúc ${new Date().toLocaleString('vi-VN')}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('exportPDF error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getDashboardData,
  getCompareYears,
  exportExcel,
  exportPDF,
};

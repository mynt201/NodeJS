const AdministrativeUnit = require('../models/AdministrativeUnit');
const RiskAssessment = require('../models/RiskAssessment');
const IndicatorValue = require('../models/IndicatorValue');
const FloodIndicator = require('../models/FloodIndicator');

/**
 * GET /api/wards - Trả về danh sách phường với risk assessment
 * Tương thích format frontend: { wards: WardData[], pagination }
 */
const getWards = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const skip = (page - 1) * limit;

        const units = await AdministrativeUnit.find({})
            .sort({
                name: 1
            })
            .skip(skip)
            .limit(limit)
            .lean();

        const unitIds = units.map((u) => u._id);
        const [assessments, indicators] = await Promise.all([
            RiskAssessment.find({
                unit_id: {
                    $in: unitIds
                },
                year
            }).lean(),
            FloodIndicator.find({}).select('_id code').lean(),
        ]);

        const assessmentMap = {};
        for (const a of assessments) {
            const uid = a.unit_id?.toString?.() ?? a.unit_id;
            if (uid) assessmentMap[uid] = a;
        }

        const indIds = indicators.map((i) => i._id);

        const indicatorValues = await IndicatorValue.find({
                unit_id: {
                    $in: unitIds
                },
                indicator_id: {
                    $in: indIds
                },
                data_year: year,
            })
            .populate('indicator_id', 'code')
            .lean();

        const valueByUnit = {};
        for (const v of indicatorValues) {
            const uid = v.unit_id?.toString?.() ?? v.unit_id;
            const code = v.indicator_id?.code;
            if (!uid || !code) continue;
            if (!valueByUnit[uid]) valueByUnit[uid] = {};
            valueByUnit[uid][code] = v.raw_value;
        }

        const wards = units.map((unit) => {
            const uid = unit._id.toString();
            const assessment = assessmentMap[uid];
            const values = valueByUnit[uid] || {};
            return {
                _id: uid,
                ward_name: unit.name,
                geometry: unit.geom || {
                    type: 'Polygon',
                    coordinates: []
                },
                population_density: values.POP ?? values.POPDENSITY ?? 0,
                rainfall: values.P ?? 0,
                low_elevation: values.H ?? 0,
                urban_land: 0,
                drainage_capacity: values.D ?? 1,
                flood_risk: assessment?.total_score,
                risk_level: assessment?.risk_level,
                district: unit.district || '',
                area_km2: unit.area_km2,
            };
        });

        const total = await AdministrativeUnit.countDocuments({});
        res.json({
            wards,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Get wards error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getWards
};
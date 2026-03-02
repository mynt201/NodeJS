const AdministrativeUnit = require('../models/AdministrativeUnit');
const RiskAssessment = require('../models/RiskAssessment');
const IndicatorValue = require('../models/IndicatorValue');

/**
 * GET /map/unit/:id/detail?year=2024
 * Chi tiết phường: unit + assessment + indicator values
 */
const getUnitDetail = async (req, res) => {
    try {
        const unitId = req.params.id;
        const year = parseInt(req.query.year || new Date().getFullYear());

        const [unit, assessment, values] = await Promise.all([
            AdministrativeUnit.findById(unitId).select('name area_km2').lean(),
            RiskAssessment.findOne({ unit_id: unitId, year }).lean(),
            IndicatorValue.find({
                unit_id: unitId,
                data_year: year
            }).populate('indicator_id', 'code name group_type weight unit').lean()
        ]);

        if (!unit) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy đơn vị' });
        }

        const indicator_values = (values || []).map((v) => {
            const ind = v.indicator_id || {};
            return {
                indicator_code: ind.code ?? '—',
                indicator_name: ind.name ?? '—',
                unit: ind.unit,
                group_type: ind.group_type,
                raw_value: v.raw_value ?? 0,
                normalized_value: v.normalized_value ?? 0
            };
        });

        res.json({
            success: true,
            data: {
                unit_id: unitId,
                name: unit.name,
                area_km2: unit.area_km2 ?? 0,
                total_score: assessment?.total_score ?? null,
                risk_level: assessment?.risk_level ?? 'Chưa có dữ liệu',
                indicator_values
            }
        });
    } catch (err) {
        console.error('Get unit detail error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getFloodRiskGeoJSON = async (req, res) => {
    try {
        const year = parseInt(req.query.year || new Date().getFullYear());
        const units = await AdministrativeUnit.find({}).lean();
        const assessments = await RiskAssessment.find({
                year
            })
            .populate('unit_id', 'name geom')
            .lean();
        const unitToAssessment = {};
        for (const a of assessments) {
            const uid = a.unit_id?._id?.toString?.() ?? a.unit_id?.toString?.();
            if (uid) unitToAssessment[uid] = a;
        }
        const features = [];
        for (const unit of units) {
            const uid = unit._id.toString();
            const assessment = unitToAssessment[uid];
            const hasData = !!assessment;
            const riskLevel = hasData ? assessment.risk_level : 'Chưa có dữ liệu';
            const totalScore = hasData ? assessment.total_score : null;
            if (!unit.geom?.coordinates) continue;
            const geom = unit.geom;
            features.push({
                type: 'Feature',
                geometry: {
                    type: geom.type,
                    coordinates: geom.coordinates,
                },
                properties: {
                    id: uid,
                    name: unit.name,
                    risk_level: riskLevel,
                    total_score: totalScore,
                },
            });
        }
        const geojson = {
            type: 'FeatureCollection',
            features,
            properties: {
                year
            },
        };
        res.json(geojson);
    } catch (err) {
        console.error('Get flood risk GeoJSON error:', err);
        res.status(500).json({
            type: 'FeatureCollection',
            features: [],
            error: err.message
        });
    }
};

module.exports = {
    getFloodRiskGeoJSON,
    getUnitDetail
};
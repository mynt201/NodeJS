const AdministrativeUnit = require('../models/AdministrativeUnit');
const RiskAssessment = require('../models/RiskAssessment');


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
            const riskLevel = assessment?.risk_level || 'Trung bình';
            const totalScore = assessment?.total_score ?? 0;
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
    getFloodRiskGeoJSON
};
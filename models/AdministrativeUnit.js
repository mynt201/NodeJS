const mongoose = require("mongoose");

const administrativeUnitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tên phường là bắt buộc"],
        trim: true,
        maxlength: [100, "Tên phường không được vượt quá 100 ký tự"],
    },
    geom: {
        type: {
            type: String,
            enum: ["Polygon", "MultiPolygon"],
            default: "MultiPolygon",
        },
        coordinates: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, "Tọa độ ranh giới là bắt buộc"],
        },
    },
    area_km2: {
        type: Number,
        min: [0, "Diện tích không được âm"],
        default: 0,
    },
}, {
    timestamps: true,
}, );

// GeoJSON 2dsphere index cho truy vấn địa lý (WGS84 - SRID 4326)
administrativeUnitSchema.index({
    geom: "2dsphere"
});
administrativeUnitSchema.index({
    name: 1
});

module.exports = mongoose.model("AdministrativeUnit", administrativeUnitSchema);
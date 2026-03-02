const mongoose = require("mongoose");

const floodIndicatorSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Mã yếu tố là bắt buộc"],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [50, "Mã yếu tố không được vượt quá 50 ký tự"],
    },
    name: {
        type: String,
        required: [true, "Tên yếu tố là bắt buộc"],
        trim: true,
        maxlength: [200, "Tên yếu tố không được vượt quá 200 ký tự"],
    },
    group_type: {
        type: String,
        required: [true, "Nhóm là bắt buộc"],
        enum: {
            values: ["Hazard", "Exposure", "Susceptibility", "Resilience"],
            message: "Nhóm phải là: Hazard, Exposure, Susceptibility, Resilience",
        },
        trim: true,
    },
    weight: {
        type: Number,
        required: [true, "Trọng số là bắt buộc"],
        min: [0, "Trọng số không được âm"],
        max: [1, "Trọng số không được vượt quá 1"],
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    unit: {
        type: String,
        trim: true,
        default: "",
    },
    /** 1 = thuận (giá trị cao = rủi ro cao), 0 = nghịch (giá trị cao = rủi ro thấp) */
    direction: {
        type: Number,
        enum: { values: [0, 1], message: "Hướng: 1 = thuận, 0 = nghịch" },
        default: 1,
    },
}, {
    timestamps: true,
}, );

floodIndicatorSchema.index({
    group_type: 1
});

module.exports = mongoose.model("FloodIndicator", floodIndicatorSchema);
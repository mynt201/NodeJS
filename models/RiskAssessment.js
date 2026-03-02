const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema({
    unit_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdministrativeUnit",
        required: [true, "Đơn vị hành chính là bắt buộc"],
    },
    year: {
        type: Number,
        required: [true, "Năm đánh giá là bắt buộc"],
        min: [2000, "Năm phải từ 2000 trở lên"],
        max: [2100, "Năm không hợp lệ"],
    },
    total_score: {
        type: Number,
        required: [true, "Điểm rủi ro là bắt buộc"],
        min: [0, "Điểm rủi ro không được âm"],
        max: [1, "Điểm rủi ro tối đa là 1 (Σ weight×normalized_value)"],
    },
    risk_level: {
        type: String,
        required: [true, "Mức độ rủi ro là bắt buộc"],
        enum: {
            values: ["Thấp", "Trung bình", "Cao"],
            message: "Mức độ phải là: Thấp (<0.34), Trung bình (0.34-0.66), Cao (>0.66)",
        },
    },
}, {
    timestamps: true,
}, );

riskAssessmentSchema.index({
    unit_id: 1,
    year: 1,
}, {
    unique: true,
}, );
riskAssessmentSchema.index({
    year: 1,
});
riskAssessmentSchema.index({
    risk_level: 1,
});

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
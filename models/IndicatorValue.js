const mongoose = require("mongoose");

const indicatorValueSchema = new mongoose.Schema({
    unit_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdministrativeUnit",
        required: [true, "Đơn vị hành chính là bắt buộc"],
    },
    indicator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FloodIndicator",
        required: [true, "Yếu tố là bắt buộc"],
    },
    data_year: {
        type: Number,
        required: [true, "Năm dữ liệu là bắt buộc"],
        min: [2000, "Năm phải từ 2000 trở lên"],
        max: [2100, "Năm không hợp lệ"],
    },
    raw_value: {
        type: Number,
        required: [true, "Giá trị thô là bắt buộc"],
    },
    normalized_value: {
        type: Number,
        required: [true, "Giá trị chuẩn hóa là bắt buộc"],
        min: [0, "Giá trị chuẩn hóa phải trong [0, 1]"],
        max: [1, "Giá trị chuẩn hóa phải trong [0, 1]"],
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, {
    timestamps: true,
}, );

// Unique: mỗi đơn vị + yếu tố + năm chỉ có 1 bản ghi
indicatorValueSchema.index({
    unit_id: 1,
    indicator_id: 1,
    data_year: 1
}, {
    unique: true
}, );
indicatorValueSchema.index({
    unit_id: 1,
    data_year: 1
});
indicatorValueSchema.index({
    indicator_id: 1,
    data_year: 1
});
indicatorValueSchema.index({
    updated_by: 1
});

module.exports = mongoose.model("IndicatorValue", indicatorValueSchema);
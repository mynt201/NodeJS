const mongoose = require("mongoose");

const indicatorThresholdSchema = new mongoose.Schema(
  {
    indicator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FloodIndicator",
      required: [true, "Chỉ số là bắt buộc"],
    },
    unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdministrativeUnit",
      required: [true, "Phường là bắt buộc"],
    },
    x_min: {
      type: Number,
      required: [true, "X_min là bắt buộc"],
      default: 0.8,
    },
    x_max: {
      type: Number,
      required: [true, "X_max là bắt buộc"],
      default: 2.0,
    },
    /** Đơn vị đo (ví dụ: m, mm, %) */
    unit: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Đơn vị không quá 50 ký tự"],
    },
  },
  { timestamps: true }
);

// Mỗi cặp (chỉ số, phường) chỉ có một bộ ngưỡng
indicatorThresholdSchema.index(
  { indicator_id: 1, unit_id: 1 },
  { unique: true }
);
indicatorThresholdSchema.index({ unit_id: 1 });
indicatorThresholdSchema.index({ indicator_id: 1 });

module.exports = mongoose.model("IndicatorThreshold", indicatorThresholdSchema);

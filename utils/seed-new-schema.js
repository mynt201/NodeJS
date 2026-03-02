/**
 * Seed dữ liệu cho schema mới
 * - flood_indicators: 5 chỉ số (H, T, P, D, Pop)
 * - administrative_units: (import từ GADM qua script riêng)
 */
const mongoose = require("mongoose");
const {
  AdministrativeUnit,
  FloodIndicator,
  IndicatorValue,
} = require("../models");
require("dotenv").config();

/** direction: 1 = thuận (giá trị cao = rủi ro cao), 0 = nghịch (giá trị cao = rủi ro thấp) */
const FLOOD_INDICATORS = [
  { code: "H", name: "Địa hình (Height/Elevation)", group_type: "Hazard", weight: 0.18, unit: "m", direction: 0, description: "Độ cao cốt nền. Vùng thấp trũng (H thấp) có nguy cơ tích tụ nước cao nhất." },
  { code: "T", name: "Triều cường (Tide)", group_type: "Hazard", weight: 0.18, unit: "cm", direction: 1, description: "Mức độ dâng của nước sông Sài Gòn. Nguồn gây ngập ngoại biên quan trọng tại An Khánh." },
  { code: "P", name: "Lượng mưa (Precipitation)", group_type: "Hazard", weight: 0.18, unit: "mm", direction: 1, description: "Cường độ mưa cục bộ. Nguồn gây ngập tại chỗ khi thoát nước không kịp." },
  { code: "D", name: "Mật độ cống (Drainage)", group_type: "Hazard", weight: 0.18, unit: "cống/km²", direction: 0, description: "Khả năng thoát nước nhân tạo. Nơi có ít cống (D thấp) sẽ bị ngập lâu hơn." },
  { code: "POP", name: "Dân số (Population)", group_type: "Exposure", weight: 0.18, unit: "người/km²", direction: 1, description: "Mật độ dân số - mức độ phơi nhiễm khi ngập." },
  { code: "GDP", name: "Thu nhập/GDP", group_type: "Resilience", weight: 0.05, direction: 1, description: "Khả năng phục hồi kinh tế." },
  { code: "EMERGENCY_CAPACITY", name: "Năng lực ứng phó", group_type: "Resilience", weight: 0.05, direction: 1, description: "Năng lực ứng phó khẩn cấp khi ngập." },
];

const seedFloodIndicators = async () => {
  const count = await FloodIndicator.countDocuments();
  if (count > 0) {
    await IndicatorValue.deleteMany({});
    await FloodIndicator.deleteMany({});
    console.log("🔄 Đã xóa flood_indicators và indicator_values cũ");
  }
  await FloodIndicator.insertMany(FLOOD_INDICATORS);
  console.log(
    `✅ Đã seed ${FLOOD_INDICATORS.length} chỉ số vào flood_indicators`,
  );
};

const seedNewSchema = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/flood-risk",
    );
    console.log("🌱 Seed schema mới...");

    await seedFloodIndicators();

    const unitCount = await AdministrativeUnit.countDocuments();
    console.log(`📊 administrative_units: ${unitCount} bản ghi`);
    if (unitCount === 0) {
      console.log(
        "💡 Chạy: node utils/import-administrative-units-from-gadm.js để import phường từ GADM",
      );
    }

    console.log("🎉 Seed hoàn tất.");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
};

seedNewSchema();

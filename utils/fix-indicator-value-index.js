/**
 * Xóa index cũ unit_id_1_indicator_id_1_year_1 (schema cũ dùng 'year')
 * Schema hiện dùng data_year. Index cũ gây E11000 duplicate key khi upsert.
 * Chạy 1 lần: node utils/fix-indicator-value-index.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const IndicatorValue = require("../models/IndicatorValue");

async function fixIndex() {
  try {
    await connectDB();
    const coll = mongoose.connection.db.collection("indicatorvalues");
    const indexes = await coll.indexes();
    const oldIndexName = "unit_id_1_indicator_id_1_year_1";

    if (indexes.some((i) => i.name === oldIndexName)) {
      await coll.dropIndex(oldIndexName);
      console.log(`✅ Đã xóa index cũ: ${oldIndexName}`);
    } else {
      console.log(`ℹ️  Index ${oldIndexName} không tồn tại (đã fix trước đó)`);
    }

    await IndicatorValue.syncIndexes();
    console.log("✅ Đã đồng bộ indexes từ schema (data_year)");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixIndex();

/**
 * Script: Lấy độ cao (elevation) cho tất cả phường hiện có
 * và lưu vào IndicatorValue cho chỉ số H (Địa hình) năm hiện tại.
 *
 * Chạy:
 *   cd flood-risk
 *   node utils/fetch-elevation-for-wards.js
 *
 * Lưu ý: dùng Open-Elevation (miễn phí, không cần key) nên nên chạy theo batch nhỏ.
 */

require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const AdministrativeUnit = require("../models/AdministrativeUnit");
const FloodIndicator = require("../models/FloodIndicator");
const IndicatorValue = require("../models/IndicatorValue");

const BATCH_SIZE = 40;
const OPEN_ELEVATION_URL = "https://api.open-elevation.com/api/v1/lookup";

async function fetchElevations(points) {
  if (points.length === 0) return [];
  const locations = points.map((p) => `${p.lat},${p.lng}`).join("|");
  const url = `${OPEN_ELEVATION_URL}?locations=${encodeURI(locations)}`;

  const resp = await axios.get(url, { timeout: 15000 });
  const results = resp.data?.results ?? [];
  return results;
}

function getCentroidFromGeom(geom) {
  if (!geom || !geom.coordinates) return null;
  const coords = geom.coordinates;

  const flatten = (arr) => {
    if (typeof arr[0] === "number") return [arr];
    return arr.reduce((acc, cur) => acc.concat(flatten(cur)), []);
  };

  const flat = flatten(coords);
  if (!flat.length) return null;

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const [x, y] of flat) {
    sumX += x;
    sumY += y;
    count += 1;
  }
  if (!count) return null;
  const lng = sumX / count;
  const lat = sumY / count;
  return { lat, lng };
}

async function main() {
  try {
    await connectDB();
    console.log("✅ Đã kết nối MongoDB");

    const currentYear = new Date().getFullYear();

    const indicatorH = await FloodIndicator.findOne({ code: "H" }).lean();
    if (!indicatorH) {
      console.error("❌ Không tìm thấy chỉ số H (Địa hình) trong FloodIndicator");
      process.exit(1);
    }
    console.log(`📌 Sử dụng chỉ số H với _id = ${indicatorH._id}`);

    const wards = await AdministrativeUnit.find({})
      .select("_id name geom")
      .lean();

    if (!wards.length) {
      console.log("⚠️ Không có phường nào trong hệ thống.");
      process.exit(0);
    }

    console.log(`📊 Tổng số phường: ${wards.length}`);

    let processed = 0;
    for (let i = 0; i < wards.length; i += BATCH_SIZE) {
      const batch = wards.slice(i, i + BATCH_SIZE);
      console.log(
        `➡️  Đang xử lý phường ${i + 1} – ${Math.min(
          i + BATCH_SIZE,
          wards.length,
        )}...`,
      );

      const points = [];
      const wardRefs = [];
      for (const w of batch) {
        const centroid = getCentroidFromGeom(w.geom);
        if (!centroid) {
          console.warn(`⚠️ Bỏ qua phường không có geom hợp lệ: ${w.name}`);
          continue;
        }
        points.push({ lat: centroid.lat, lng: centroid.lng });
        wardRefs.push(w);
      }

      if (!points.length) continue;

      let elevations;
      try {
        elevations = await fetchElevations(points);
      } catch (err) {
        console.error("❌ Lỗi khi gọi Open-Elevation:", err.message || err);
        continue;
      }

      const ops = [];
      for (let idx = 0; idx < wardRefs.length; idx++) {
        const ward = wardRefs[idx];
        const el = elevations[idx]?.elevation;
        if (typeof el !== "number") {
          console.warn(
            `⚠️ Không nhận được elevation hợp lệ cho phường ${ward.name}`,
          );
          continue;
        }

        ops.push(
          IndicatorValue.findOneAndUpdate(
            {
              unit_id: ward._id,
              indicator_id: indicatorH._id,
              data_year: currentYear,
            },
            {
              raw_value: el,
              normalized_value: 0.5,
              updated_by: null,
            },
            {
              upsert: true,
              new: true,
              runValidators: true,
            },
          ),
        );
      }

      if (ops.length) {
        await Promise.all(ops);
        processed += ops.length;
        console.log(`✅ Đã lưu elevation cho ${ops.length} phường (tổng: ${processed})`);
      }

      await new Promise((res) => setTimeout(res, 1500));
    }

    console.log("🎉 Hoàn tất fetch độ cao cho các phường.");
  } catch (err) {
    console.error("❌ Lỗi trong script fetch-elevation:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();


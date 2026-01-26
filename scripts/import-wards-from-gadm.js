/**
 * Import 24 phường từ GADM (Quận 2, Quận 9 - TP.HCM) vào DB
 * Chạy: node scripts/import-wards-from-gadm.js
 * GADM file: ~/Downloads/Telegram Desktop/gadm41_VNM_3.json
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });
else require('dotenv').config();

const Ward = require('../models/Ward');

const GADM_PATH =
  process.env.GADM_JSON_PATH ||
  path.join(
    process.env.HOME || process.env.USERPROFILE,
    'Downloads',
    'Telegram Desktop',
    'gadm41_VNM_3.json'
  );

// NAME_3 (GADM) -> "Phường X" (hiển thị)
const NAME_3_TO_WARD_NAME = {
  AnLợiĐông: 'Phường An Lợi Đông',
  AnKhánh: 'Phường An Khánh',
  AnPhú: 'Phường An Phú',
  BìnhAn: 'Phường Bình An',
  BìnhKhánh: 'Phường Bình Khánh',
  BìnhTrưngĐông: 'Phường Bình Trưng Đông',
  BìnhTrưngTây: 'Phường Bình Trưng Tây',
  CátLái: 'Phường Cát Lái',
  ThạnhMỹLợi: 'Phường Thạnh Mỹ Lợi',
  ThảoĐiền: 'Phường Thảo Điền',
  ThủThiêm: 'Phường Thủ Thiêm',
  PhướcLongA: 'Phường Phước Long A',
  PhướcLongB: 'Phường Phước Long B',
  TăngNhơnPhúA: 'Phường Tăng Nhơn Phú A',
  TăngNhơnPhúB: 'Phường Tăng Nhơn Phú B',
  LongTrường: 'Phường Long Trường',
  TrườngThạnh: 'Phường Trường Thạnh',
  PhướcBình: 'Phường Phước Bình',
  TânPhú: 'Phường Tân Phú',
  HiệpPhú: 'Phường Hiệp Phú',
  LongThạnhMỹ: 'Phường Long Thạnh Mỹ',
  LongBình: 'Phường Long Bình',
  LongPhước: 'Phường Long Phước',
  PhúHữu: 'Phường Phú Hữu',
};

const TARGET_DISTRICTS = ['Quận2', 'Quận9'];
const PROVINCE_HCM = 'HồChíMinh';
const DISPLAY_DISTRICT = { Quận2: 'Quận 2', Quận9: 'Quận 9' };

function gadmToWard(feature) {
  const props = feature.properties;
  const name3 = props.NAME_3;
  const district = props.NAME_2;
  if (!NAME_3_TO_WARD_NAME[name3] || !TARGET_DISTRICTS.includes(district)) return null;
  if (props.NAME_1 !== PROVINCE_HCM) return null;

  const geom = feature.geometry;
  const wardName = NAME_3_TO_WARD_NAME[name3];

  return {
    ward_name: wardName,
    district: DISPLAY_DISTRICT[district] || district.replace(/([a-zA-Zà-ỹ])(\d)/, '$1 $2'),
    province: 'Thành phố Hồ Chí Minh',
    geometry: {
      type: geom.type,
      coordinates: geom.coordinates,
    },
    population_density: 0,
    rainfall: 0,
    low_elevation: 0,
    urban_land: 0,
    drainage_capacity: 0,
    population: 0,
    infrastructure_count: { roads: 0, bridges: 0, drainage_systems: 0 },
    isActive: true,
  };
}

async function run() {
  if (!fs.existsSync(GADM_PATH)) {
    console.error('❌ Không tìm thấy file GADM:', GADM_PATH);
    process.exit(1);
  }

  console.log('📂 Đọc file GADM...');
  const raw = fs.readFileSync(GADM_PATH, 'utf8');
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];

  const wards = [];
  for (const f of features) {
    const w = gadmToWard(f);
    if (w) wards.push(w);
  }

  console.log(`📍 Trích xuất ${wards.length} phường từ GADM.`);

  if (wards.length === 0) {
    console.log('⚠️ Không có phường nào khớp. Kiểm tra GADM_PATH và bộ lọc.');
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ Thiếu DATABASE_URL trong .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.DATABASE_URL);
  console.log('🗄️ Đã kết nối MongoDB.');

  const results = { success: 0, duplicate: 0, failed: [] };

  for (const w of wards) {
    try {
      const exists = await Ward.findOne({ ward_name: w.ward_name });
      if (exists) {
        results.duplicate++;
        console.log(`⏭️  Đã tồn tại: ${w.ward_name}`);
        continue;
      }
      await Ward.create(w);
      results.success++;
      console.log(`✅ Thêm: ${w.ward_name} (${w.district})`);
    } catch (e) {
      results.failed.push({ ward_name: w.ward_name, error: e.message });
      console.error(`❌ Lỗi ${w.ward_name}:`, e.message);
    }
  }

  await mongoose.connection.close();
  console.log('\n📋 Kết quả:', results);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

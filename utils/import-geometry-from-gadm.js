/**
 * Import 24 phường Thủ Đức (Quận 2, Quận 9) từ GADM vào administrative_units
 * Chạy: node utils/import-geometry-from-gadm.js [đường_dẫn_gadm.json] [--fresh]
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const AdministrativeUnit = require('../models/AdministrativeUnit');
require('dotenv').config();

const TARGET_WARDS = {
  'An Lợi Đông': ['AnLợiĐông'],
  'An Khánh': ['AnKhánh'],
  'An Phú': ['AnPhú'],
  'Bình An': ['BìnhAn'],
  'Bình Khánh': ['BìnhKhánh'],
  'Bình Trưng Đông': ['BìnhTrưngĐông'],
  'Bình Trưng Tây': ['BìnhTrưngTây'],
  'Cát Lái': ['CátLái'],
  'Thạnh Mỹ Lợi': ['ThạnhMỹLợi'],
  'Thảo Điền': ['ThảoĐiền'],
  'Thủ Thiêm': ['ThủThiêm'],
  'Phước Long A': ['PhướcLongA'],
  'Phước Long B': ['PhướcLongB'],
  'Tăng Nhơn Phú A': ['TăngNhơnPhúA'],
  'Tăng Nhơn Phú B': ['TăngNhơnPhúB'],
  'Long Trường': ['LongTrường'],
  'Trường Thạnh': ['TrườngThạnh'],
  'Phước Bình': ['PhướcBình'],
  'Tân Phú': ['TânPhú'],
  'Hiệp Phú': ['HiệpPhú'],
  'Long Thạnh Mỹ': ['LongThạnhMỹ'],
  'Long Bình': ['LongBình'],
  'Long Phước': ['LongPhước'],
  'Phú Hữu': ['PhúHữu'],
};
const QUAN2 = ['An Lợi Đông', 'An Khánh', 'An Phú', 'Bình An', 'Bình Khánh', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Cát Lái', 'Thạnh Mỹ Lợi', 'Thảo Điền', 'Thủ Thiêm'];
const QUAN9 = ['Phước Long A', 'Phước Long B', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Long Trường', 'Trường Thạnh', 'Phước Bình', 'Tân Phú', 'Hiệp Phú', 'Long Thạnh Mỹ', 'Long Bình', 'Long Phước', 'Phú Hữu'];

const normalize = (s) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

/** Format "AnPhúTây" -> "An Phú Tây" - thêm space trước chữ in hoa (A-Z, Đ, Â, Ê, Ô, Ơ, Ư) */
const formatWardName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/([a-zà-ỹế])([A-ZĐÂÊÔƠƯ])/g, '$1 $2');
};

/** Diện tích xấp xỉ (km²) - shoelace trên WGS84 */
const approximateAreaKm2 = (coordinates) => {
  try {
    const getFirstRing = (c) => {
      if (!Array.isArray(c) || !c.length) return null;
      const first = c[0];
      if (Array.isArray(first) && first.length >= 3) {
        const pt = first[0];
        if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number') return first;
        if (typeof pt === 'number') return first;
      }
      return getFirstRing(first);
    };
    const ring = getFirstRing(coordinates);
    if (!ring || ring.length < 3) return 0;
    const R = 6371;
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      const [xi, yi] = ring[i].map((n) => (n * Math.PI) / 180);
      const [xj, yj] = ring[j].map((n) => (n * Math.PI) / 180);
      area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
    }
    return Math.round(Math.abs(area) * R * R * 0.5 * 100) / 100;
  } catch {
    return 0;
  }
};

const findGadmPath = () => {
  const candidates = [
    path.join(__dirname, 'gadm41_VNM_3.json'),
    path.join(__dirname, '..', '..', 'src', 'pages', 'gadm41_VNM_3.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const main = async () => {
  try {
    console.log('🚀 Import geometry từ GADM vào administrative_units\n');

    const args = process.argv.slice(2);
    const fresh = args.includes('--fresh');
    const geoPath = args.find((a) => !a.startsWith('--')) || findGadmPath();

    if (fresh) {
      console.log('⚠️  Chế độ --fresh: sẽ xóa toàn bộ administrative_units trước khi import.\n');
    }
    if (!geoPath || !fs.existsSync(geoPath)) {
      console.error('❌ Không tìm thấy file GADM.');
      console.log('   Cách dùng: node utils/import-geometry-from-gadm.js [đường_dẫn_gadm.json]');
      console.log('   Hoặc đặt file tại: flood-risk/utils/gadm41_VNM_3.json');
      process.exit(1);
    }
    console.log(`📂 File: ${geoPath}\n`);

    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/dbconnect';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB\n');

    const raw = fs.readFileSync(geoPath, 'utf8');
    const geo = JSON.parse(raw);
    const features = geo.features || [];

    const hcmc = features.filter((f) => f.properties?.NAME_1 === 'HồChíMinh');
    console.log(`📍 Tìm thấy ${hcmc.length} phường/xã TP.HCM trong GADM`);
    console.log(`   Chỉ import 24 phường Thủ Đức (Quận 2 + Quận 9)\n`);

    if (fresh) {
      const deleted = await AdministrativeUnit.deleteMany({});
      console.log(`🗑️  Đã xóa ${deleted.deletedCount} bản ghi cũ\n`);
    }

    let created = 0;
    let updated = 0;

    for (const feat of hcmc) {
      if (!feat.properties?.NAME_3 || !feat.geometry?.coordinates) continue;

      const rawName = feat.properties.NAME_3.trim();
      const district = feat.properties.NAME_2 || '';
      const nwn = normalize(rawName);
      let matchedTarget = null;

      for (const [targetName, possibleNames] of Object.entries(TARGET_WARDS)) {
        const isValidDistrict = QUAN2.includes(targetName) ? district.includes('Quận2') : QUAN9.includes(targetName) ? district.includes('Quận9') : false;
        if (!isValidDistrict) continue;
        if (nwn === normalize(targetName)) {
          matchedTarget = targetName;
          break;
        }
        for (const p of possibleNames) {
          if (nwn === normalize(p)) {
            matchedTarget = targetName;
            break;
          }
        }
        if (matchedTarget) break;
      }

      if (!matchedTarget) continue;

      const name = matchedTarget;
      const geom = {
        type: feat.geometry.type || 'MultiPolygon',
        coordinates: feat.geometry.coordinates,
      };
      const area_km2 = approximateAreaKm2(geom.coordinates);

      const existing = await AdministrativeUnit.findOne({ name });
      if (existing) {
        existing.geom = geom;
        existing.area_km2 = area_km2;
        await existing.save();
        updated++;
        console.log(`   📝 Cập nhật: ${name} (${area_km2} km²)`);
      } else {
        await AdministrativeUnit.create({ name, geom, area_km2 });
        created++;
        console.log(`   ➕ Tạo mới: ${name} (${area_km2} km²)`);
      }
    }

    const toDelete = await AdministrativeUnit.find({ name: { $nin: Object.keys(TARGET_WARDS) } });
    if (toDelete.length > 0) {
      await AdministrativeUnit.deleteMany({ name: { $nin: Object.keys(TARGET_WARDS) } });
      console.log(`\n🗑️  Đã xóa ${toDelete.length} phường không thuộc danh sách 24`);
    }

    console.log(`\n📊 Kết quả: ${created} mới, ${updated} cập nhật`);
    console.log('🎉 Hoàn thành.');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) main();

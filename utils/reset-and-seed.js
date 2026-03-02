/**
 * Reset database và seed dữ liệu mặc định
 * - Tạo Super Admin (admin_thu_duc / admin123)
 * - Seed flood_indicators (7 chỉ số: H, T, P, D, Pop, GDP, EMERGENCY_CAPACITY)
 * - Import administrative_units (24 phường Thủ Đức từ GADM)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const FloodIndicator = require('../models/FloodIndicator');
const AdministrativeUnit = require('../models/AdministrativeUnit');
const IndicatorValue = require('../models/IndicatorValue');
const RiskAssessment = require('../models/RiskAssessment');
const Settings = require('../models/Settings');

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/dbconnect';

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

// Trọng số AHP từ ma trận so sánh cặp (Geometric Mean):
//        H    T    P   POP   D
// H      1    2    3    5    4
// T     1/2   1    2    4    3
// P     1/3  1/2   1    3    2
// POP   1/5  1/4  1/3   1   1/2
// D     1/4  1/3  1/2   2    1
// → w_H=0.424, w_T=0.268, w_P=0.163, w_POP=0.065, w_D=0.080
const FLOOD_INDICATORS = [{
  code: 'H',
  name: 'Địa hình (Height/Elevation)',
  group_type: 'Hazard',
  weight: 0.424,
  unit: 'm',
  direction: 0,
  description: 'Độ cao cốt nền. Vùng thấp trũng (H thấp) có nguy cơ tích tụ nước cao nhất.'
},
{
  code: 'T',
  name: 'Triều cường (Tide)',
  group_type: 'Hazard',
  weight: 0.268,
  unit: 'cm',
  direction: 1,
  description: 'Mức độ dâng của nước sông Sài Gòn. Nguồn gây ngập ngoại biên quan trọng tại An Khánh.'
},
{
  code: 'P',
  name: 'Lượng mưa (Precipitation)',
  group_type: 'Hazard',
  weight: 0.163,
  unit: 'mm',
  direction: 1,
  description: 'Cường độ mưa cục bộ. Nguồn gây ngập tại chỗ khi thoát nước không kịp.'
},
{
  code: 'D',
  name: 'Mật độ cống (Drainage)',
  group_type: 'Hazard',
  weight: 0.080,
  unit: 'cống/km²',
  direction: 0,
  description: 'Khả năng thoát nước nhân tạo. Nơi có ít cống (D thấp) sẽ bị ngập lâu hơn.'
},
{
  code: 'POP',
  name: 'Dân số (Population)',
  group_type: 'Exposure',
  weight: 0.065,
  unit: 'người/km²',
  direction: 1,
  description: 'Mật độ dân số - mức độ phơi nhiễm khi ngập.'
},
];

const createSuperAdmin = async () => {
  const plainPassword = 'admin123';
  const password_hash = await bcrypt.hash(plainPassword, 10);

  const existing = await User.findOne({
    $or: [{
      username: 'admin_thu_duc'
    }, {
      email: 'admin@floodrisk.com'
    }]
  });
  if (existing) {
    existing.password_hash = password_hash;
    existing.full_name = 'System Administrator';
    existing.role = 'SUPER_ADMIN';
    existing.ward_id = null;
    existing.is_active = true;
    await existing.save();
    console.log('🔄 Đã cập nhật Super Admin');
  } else {
    await User.create({
      username: 'admin_thu_duc',
      email: 'admin@floodrisk.com',
      password_hash,
      full_name: 'System Administrator',
      role: 'SUPER_ADMIN',
      ward_id: null,
      is_active: true,
    });
    console.log('✅ Đã tạo Super Admin');
  }
  console.log('   👤 Username: admin_thu_duc');
  console.log('   🔑 Password: admin123');
};

const seedFloodIndicators = async () => {
  const count = await FloodIndicator.countDocuments();
  if (count > 0) {
    await IndicatorValue.deleteMany({});
    await FloodIndicator.deleteMany({});
    console.log('🔄 Đã xóa flood_indicators và indicator_values cũ');
  }
  await FloodIndicator.insertMany(FLOOD_INDICATORS);
  console.log(`✅ Đã seed ${FLOOD_INDICATORS.length} chỉ số flood_indicators`);
};

const seedAdministrativeUnits = async () => {
  const geoPath = path.join(__dirname, 'gadm41_VNM_3.json');
  if (!fs.existsSync(geoPath)) {
    console.log('⏭️  Bỏ qua administrative_units (không tìm thấy gadm41_VNM_3.json)');
    return;
  }
  const norm = (s) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  const getRing = (c) => {
    if (!Array.isArray(c) || !c.length) return null;
    const f = c[0];
    if (Array.isArray(f) && f.length >= 2 && typeof f[0] === 'number') return f;
    return getRing(f);
  };
  const areaKm2 = (coords) => {
    try {
      const ring = getRing(coords);
      if (!ring || ring.length < 3) return 0;
      const R = 6371;
      let a = 0;
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length;
        const [xi, yi] = ring[i].map((n) => (n * Math.PI) / 180);
        const [xj, yj] = ring[j].map((n) => (n * Math.PI) / 180);
        a += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
      }
      return Math.round(Math.abs(a) * R * R * 0.5 * 100) / 100;
    } catch {
      return 0;
    }
  };
  const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
  const hcmc = (geo.features || []).filter((f) => f.properties?.NAME_1 === 'HồChíMinh');
  const wards = [];
  for (const feat of hcmc) {
    if (!feat.properties?.NAME_3) continue;
    const wn = feat.properties.NAME_3.trim();
    const nwn = norm(wn);
    const dist = feat.properties.NAME_2 || '';
    let match = null;
    for (const [t, poss] of Object.entries(TARGET_WARDS)) {
      const ok = QUAN2.includes(t) ? dist.includes('Quận2') : QUAN9.includes(t) ? dist.includes('Quận9') : true;
      if (!ok) continue;
      if (nwn === norm(t)) {
        match = t;
        break;
      }
      for (const p of poss) {
        if (nwn === norm(p)) {
          match = t;
          break;
        }
      }
      if (match) break;
    }
    if (match) {
      const geom = feat.geometry;
      wards.push({
        name: match,
        geom: {
          type: geom.type,
          coordinates: geom.coordinates
        },
        area_km2: areaKm2(geom.coordinates),
      });
    }
  }
  if (wards.length === 0) {
    console.log('⏭️  Không tìm thấy phường Thủ Đức trong GADM');
    return;
  }
  let created = 0,
    updated = 0;
  for (const w of wards) {
    const ex = await AdministrativeUnit.findOne({
      name: w.name
    });
    if (ex) {
      ex.geom = w.geom;
      ex.area_km2 = w.area_km2;
      await ex.save();
      updated++;
    } else {
      await AdministrativeUnit.create(w);
      created++;
    }
  }
  console.log(`✅ administrative_units: ${created} mới, ${updated} cập nhật (tổng ${wards.length} phường)`);
};

const ensureCollections = async () => {
  const db = mongoose.connection.db;
  const names = await db.listCollections().toArray();
  const existing = names.map((c) => c.name);
  for (const Model of [IndicatorValue, RiskAssessment, Settings]) {
    const name = Model.collection.name;
    if (!existing.includes(name)) {
      await db.createCollection(name);
      console.log(`✅ Tạo collection: ${name}`);
    }
  }
};

const main = async () => {
  try {
    console.log('🚀 Reset & Seed database...\n');
    console.log(`📡 Kết nối: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    await createSuperAdmin();
    await seedFloodIndicators();
    await seedAdministrativeUnits();
    await ensureCollections();

    console.log('\n🎉 Hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

main();
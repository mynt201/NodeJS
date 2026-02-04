const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Ward = require('../models/Ward');
require('dotenv').config();

// Danh sách các phường cần import với mapping chính xác
// Format: { targetName: [possibleNamesInJSON] }
const targetWardsMapping = {
  'An Lợi Đông': ['AnLợiĐông'],
  'An Khánh': ['AnKhánh'],
  'An Phú': ['AnPhú'], // Chỉ lấy AnPhú ở Quận2, không lấy AnPhúTây, AnPhúĐông
  'Bình An': ['BìnhAn'],
  'Bình Khánh': ['BìnhKhánh'], // Chỉ lấy ở Quận2
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
  'Tân Phú': ['TânPhú'], // Chỉ lấy ở Quận9, không lấy ở Quận7
  'Hiệp Phú': ['HiệpPhú'], // Chỉ lấy ở Quận9, không lấy HiệpPhước
  'Long Thạnh Mỹ': ['LongThạnhMỹ'],
  'Long Bình': ['LongBình'],
  'Long Phước': ['LongPhước'],
  'Phú Hữu': ['PhúHữu']
};

const targetWards = Object.keys(targetWardsMapping);

// Hàm chuẩn hóa tên phường để so sánh
const normalizeWardName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/\s+/g, ''); // Loại bỏ tất cả khoảng trắng
};

// Hàm tính centroid từ MultiPolygon
const calculateCentroid = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates)) return null;
  
  let totalLat = 0;
  let totalLng = 0;
  let pointCount = 0;

  const processPolygon = (polygon) => {
    if (!Array.isArray(polygon)) return;
    
    polygon.forEach(ring => {
      if (Array.isArray(ring)) {
        ring.forEach(point => {
          if (Array.isArray(point) && point.length >= 2) {
            totalLng += point[0]; // Longitude
            totalLat += point[1]; // Latitude
            pointCount++;
          }
        });
      }
    });
  };

  // Xử lý MultiPolygon
  coordinates.forEach(polygon => {
    if (Array.isArray(polygon)) {
      processPolygon(polygon);
    }
  });

  if (pointCount === 0) return null;

  return {
    lng: totalLng / pointCount,
    lat: totalLat / pointCount
  };
};

// Hàm tìm phường trong file JSON
const findWardsInGeoJSON = (geoJsonPath) => {
  console.log(`📖 Đang đọc file: ${geoJsonPath}`);
  
  const fileContent = fs.readFileSync(geoJsonPath, 'utf8');
  const geoJson = JSON.parse(fileContent);
  
  const foundWards = [];
  const normalizedTargetWards = targetWards.map(normalizeWardName);
  
  // Chỉ tìm trong Hồ Chí Minh
  const hcmcFeatures = geoJson.features.filter(f => 
    f.properties && f.properties.NAME_1 === 'HồChíMinh'
  );
  
  console.log(`🔍 Đang tìm ${targetWards.length} phường trong ${hcmcFeatures.length} phường của Hồ Chí Minh...`);
  
  hcmcFeatures.forEach((feature) => {
    if (!feature.properties || !feature.properties.NAME_3) return;
    
    const wardName = feature.properties.NAME_3.trim();
    const normalizedWardName = normalizeWardName(wardName);
    
    // Tìm kiếm khớp chính xác dựa trên mapping
    let matchedTarget = null;
    const district = feature.properties.NAME_2 || '';
    
    // Các phường ở Quận 2
    const quận2Wards = ['An Lợi Đông', 'An Khánh', 'An Phú', 'Bình An', 'Bình Khánh', 
                        'Bình Trưng Đông', 'Bình Trưng Tây', 'Cát Lái', 'Thạnh Mỹ Lợi', 
                        'Thảo Điền', 'Thủ Thiêm'];
    // Các phường ở Quận 9
    const quận9Wards = ['Phước Long A', 'Phước Long B', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B',
                        'Long Trường', 'Trường Thạnh', 'Phước Bình', 'Tân Phú', 'Hiệp Phú',
                        'Long Thạnh Mỹ', 'Long Bình', 'Long Phước', 'Phú Hữu'];
    
    for (const [targetName, possibleNames] of Object.entries(targetWardsMapping)) {
      const normalizedTarget = normalizeWardName(targetName);
      
      // Kiểm tra điều kiện quận trước
      let isValidDistrict = true;
      if (quận2Wards.includes(targetName)) {
        isValidDistrict = district.includes('Quận2');
      } else if (quận9Wards.includes(targetName)) {
        isValidDistrict = district.includes('Quận9');
      }
      
      if (!isValidDistrict) {
        continue; // Skip nếu không đúng quận
      }
      
      // Khớp chính xác với tên trong mapping
      if (normalizedWardName === normalizedTarget) {
        matchedTarget = targetName;
        break;
      }
      
      // Hoặc khớp với một trong các tên có thể trong JSON
      for (const possibleName of possibleNames) {
        const normalizedPossible = normalizeWardName(possibleName);
        if (normalizedWardName === normalizedPossible) {
          matchedTarget = targetName;
          break;
        }
      }
      
      if (matchedTarget) break;
    }
    
    if (matchedTarget) {
      const geometry = feature.geometry;
      const centroid = calculateCentroid(geometry.coordinates);
      
      foundWards.push({
        originalName: wardName,
        matchedName: matchedTarget,
        properties: feature.properties,
        geometry: {
          type: geometry.type,
          coordinates: geometry.coordinates
        },
        centroid: centroid
      });
      
      console.log(`✅ Tìm thấy: ${wardName} (${feature.properties.NAME_2}) -> ${matchedTarget}`);
    }
  });
  
  return foundWards;
};

// Hàm import vào database
const importWardsToDatabase = async (wards) => {
  console.log(`\n📥 Đang import ${wards.length} phường vào database...`);
  
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  
  for (const ward of wards) {
    try {
      const wardCode = ward.properties.GID_3 || `WARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const wardName = ward.matchedName;
      // Chuẩn hóa tên quận/huyện: Quận2 -> Quận 2
      let district = ward.properties.NAME_2 || 'Thành phố Hồ Chí Minh';
      if (district.startsWith('Quận') && district.length > 4) {
        district = district.replace(/Quận(\d+)/, 'Quận $1');
      }
      const province = 'Thành phố Hồ Chí Minh';
      
      // Kiểm tra xem phường đã tồn tại chưa
      const existingWard = await Ward.findOne({ 
        $or: [
          { ward_name: wardName },
          { ward_code: wardCode }
        ]
      });
      
      if (existingWard) {
        // Cập nhật geometry nếu đã tồn tại
        existingWard.geometry = {
          type: ward.geometry.type,
          coordinates: ward.geometry.coordinates
        };
        existingWard.district = district;
        existingWard.province = province;
        existingWard.lastUpdated = new Date();
        
        await existingWard.save();
        updateCount++;
        console.log(`🔄 Đã cập nhật: ${wardName}`);
      } else {
        // Tạo mới
        const newWard = new Ward({
          ward_code: wardCode,
          ward_name: wardName,
          district: district,
          province: province,
          geometry: {
            type: ward.geometry.type,
            coordinates: ward.geometry.coordinates
          },
          // Giá trị mặc định cho các trường khác
          population_density: 0,
          rainfall: 0,
          low_elevation: 0,
          urban_land: 0,
          drainage_capacity: 0,
          flood_risk: 0,
          risk_level: 'Low',
          exposure: 0,
          susceptibility: 0,
          resilience: 0,
          isActive: true
        });
        
        await newWard.save();
        successCount++;
        console.log(`✅ Đã tạo mới: ${wardName}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Lỗi khi import ${ward.matchedName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Kết quả import:`);
  console.log(`   ✅ Tạo mới: ${successCount}`);
  console.log(`   🔄 Cập nhật: ${updateCount}`);
  console.log(`   ❌ Lỗi: ${errorCount}`);
};

// Hàm chính
const main = async () => {
  try {
    console.log('🚀 Bắt đầu import phường từ GADM GeoJSON...\n');
    
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flood-risk';
    console.log(`🔌 Đang kết nối database: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database thành công\n');
    
    // Đọc file GeoJSON
    const geoJsonPath = path.join(__dirname, 'gadm41_VNM_3.json');
    
    if (!fs.existsSync(geoJsonPath)) {
      throw new Error(`File không tồn tại: ${geoJsonPath}`);
    }
    
    // Tìm các phường
    const foundWards = findWardsInGeoJSON(geoJsonPath);
    
    if (foundWards.length === 0) {
      console.log('⚠️  Không tìm thấy phường nào trong danh sách!');
      console.log('\n📋 Danh sách phường cần tìm:');
      targetWards.forEach((ward, index) => {
        console.log(`   ${index + 1}. ${ward}`);
      });
      return;
    }
    
    console.log(`\n✅ Tìm thấy ${foundWards.length}/${targetWards.length} phường\n`);
    
    // Import vào database
    await importWardsToDatabase(foundWards);
    
    console.log('\n🎉 Hoàn thành import!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối database');
  }
};

// Chạy script
if (require.main === module) {
  main();
}

module.exports = { findWardsInGeoJSON, importWardsToDatabase };

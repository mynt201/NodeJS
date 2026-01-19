# 🌤️ Hướng dẫn Sync Weather Data từ OpenWeatherMap API

## Bước 1: Lấy API Key

1. Đăng ký tài khoản miễn phí tại: https://openweathermap.org/api
2. Vào phần **API Keys** và tạo key mới
3. Copy API key (cần đợi 1-2 giờ để key được kích hoạt)

## Bước 2: Cấu hình Environment Variable

Thêm vào file `.env` trong thư mục `flood-risk-backend`:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

**Lưu ý:** 
- Nếu chưa có file `.env`, tạo file mới
- API key cần 1-2 giờ để được kích hoạt sau khi tạo

## Bước 3: Chạy Script Sync

### Cách 1: Sử dụng npm script (Khuyến nghị)

```bash
cd flood-risk-backend
npm run sync-weather
```

### Cách 2: Chạy trực tiếp

```bash
cd flood-risk-backend
node scripts/sync-weather.js
```

## Kết quả

Script sẽ:
- ✅ Kết nối database
- ✅ Tìm tất cả wards ở Hồ Chí Minh
- ✅ Lấy weather data từ OpenWeatherMap API cho mỗi ward
- ✅ Lưu vào database (update nếu đã có, tạo mới nếu chưa có)
- ✅ Hiển thị summary với số lượng successful/failed

## Ví dụ Output

```
🌤️  Starting weather data sync from OpenWeatherMap API...

✅ Connected to database

📊 Found 50 wards in Ho Chi Minh City

[1/50] Processing: Phường Bến Nghé (Quận 1)
   📍 Coordinates: 10.7769, 106.7009
   🌡️  Fetching current weather...
   ✅ Created new weather data
   🌡️  Temp: 28.5°C
   💧 Humidity: 75%
   🌧️  Rainfall: 5.2mm
   🌬️  Wind: 15.5 km/h
   ☁️  Condition: Rain

[2/50] Processing: Phường Đa Kao (Quận 1)
   ...

============================================================
📊 SYNC SUMMARY
============================================================
✅ Successful: 48
❌ Failed: 2
📅 Date: 2024-01-15
============================================================

✅ Weather data sync completed!
```

## Troubleshooting

### Lỗi: "OPENWEATHER_API_KEY is not configured"
- Kiểm tra file `.env` có `OPENWEATHER_API_KEY` chưa
- Đảm bảo file `.env` ở đúng thư mục `flood-risk-backend`

### Lỗi: "401 Unauthorized"
- API key chưa được kích hoạt (đợi 1-2 giờ)
- API key không đúng
- Kiểm tra API key trên OpenWeatherMap dashboard

### Lỗi: "429 Too Many Requests"
- Đã vượt quá rate limit (60 calls/minute)
- Script tự động delay 1.1 giây giữa các requests
- Nếu vẫn lỗi, đợi 1 phút rồi chạy lại

### Không có wards trong database
- Cần import wards trước
- Kiểm tra wards có `province` chứa "Hồ Chí Minh" hoặc "Ho Chi Minh"

## Lưu ý

1. **Rate Limiting**: Free tier giới hạn 60 calls/minute
2. **API Key Activation**: Cần đợi 1-2 giờ sau khi tạo key
3. **Coordinates**: Script tự động tính tọa độ trung tâm từ ward geometry
4. **Date**: Weather data được lưu với date = hôm nay (00:00:00)
5. **Duplicate Prevention**: Script tự động update nếu data đã tồn tại

## Alternative: Sử dụng API Endpoint

Nếu muốn sync qua API endpoint:

```bash
# Login as admin để lấy token
POST http://localhost:3000/api/users/login
Body: {
  "email": "admin@example.com",
  "password": "AdminPass123"
}

# Sync weather data
POST http://localhost:3000/api/weather/sync
Authorization: Bearer <token>
Body: {
  "include_forecast": false
}
```

---

**Happy Syncing! 🌤️**

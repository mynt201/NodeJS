# 🔑 Hướng dẫn Lấy OpenWeatherMap API Key

## Bước 1: Đăng ký Tài khoản OpenWeatherMap

1. Truy cập: https://openweathermap.org/api
2. Click nút **"Sign Up"** hoặc **"Sign In"** ở góc trên bên phải
3. Điền thông tin đăng ký:
   - Username
   - Email
   - Password
4. Click **"Create Account"**
5. Kiểm tra email để xác nhận tài khoản

## Bước 2: Lấy API Key

1. Sau khi đăng nhập, vào trang: https://home.openweathermap.org/api_keys
2. Bạn sẽ thấy phần **"API keys"**
3. Click nút **"Create key"** hoặc **"Generate"**
4. Đặt tên cho key (ví dụ: "Flood Risk App")
5. Click **"Generate"**
6. **Copy API key** (dạng: `abc123def456ghi789jkl012mno345pq`)

**⚠️ Lưu ý quan trọng:**
- API key mới tạo cần **1-2 giờ** để được kích hoạt
- Free tier cho phép: **60 calls/minute**, **1,000,000 calls/month**
- Giữ bí mật API key, không chia sẻ công khai

## Bước 3: Thêm API Key vào File .env

### Cách 1: Tạo file .env mới

1. Vào thư mục `flood-risk-backend`
2. Tạo file mới tên `.env` (không có extension)
3. Copy nội dung từ file `.env.example` (nếu có)
4. Thêm dòng:
   ```env
   OPENWEATHER_API_KEY=paste_your_api_key_here
   ```

### Cách 2: Thêm vào file .env đã có

1. Mở file `.env` trong thư mục `flood-risk-backend`
2. Thêm dòng mới:
   ```env
   OPENWEATHER_API_KEY=paste_your_api_key_here
   ```
3. Thay `paste_your_api_key_here` bằng API key bạn đã copy

### Ví dụ file .env:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/flood_risk_db

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d

# OpenWeatherMap API Key
OPENWEATHER_API_KEY=abc123def456ghi789jkl012mno345pq
```

## Bước 4: Kiểm tra API Key

### Cách 1: Chạy Script Sync

```bash
cd flood-risk-backend
npm run sync-weather
```

Nếu API key đúng, script sẽ chạy và sync weather data.

### Cách 2: Test qua API Endpoint

1. Start server:
   ```bash
   npm run dev
   ```

2. Login as admin để lấy token:
   ```bash
   POST http://localhost:3000/api/users/login
   Body: {
     "email": "admin@example.com",
     "password": "AdminPass123"
   }
   ```

3. Test sync endpoint:
   ```bash
   POST http://localhost:3000/api/weather/sync
   Authorization: Bearer <token>
   Body: {
     "include_forecast": false
   }
   ```

## Troubleshooting

### Lỗi: "OPENWEATHER_API_KEY is not configured"

**Nguyên nhân:**
- File `.env` chưa có biến `OPENWEATHER_API_KEY`
- File `.env` không ở đúng thư mục `flood-risk-backend`
- Server chưa restart sau khi thêm env variable

**Giải pháp:**
1. Kiểm tra file `.env` có trong thư mục `flood-risk-backend` không
2. Kiểm tra có dòng `OPENWEATHER_API_KEY=...` trong file
3. Restart server nếu đang chạy

### Lỗi: "401 Unauthorized" từ OpenWeatherMap

**Nguyên nhân:**
- API key chưa được kích hoạt (cần đợi 1-2 giờ)
- API key không đúng
- API key đã bị xóa hoặc vô hiệu hóa

**Giải pháp:**
1. Đợi 1-2 giờ sau khi tạo key
2. Kiểm tra lại API key trên OpenWeatherMap dashboard
3. Tạo API key mới nếu cần

### Lỗi: "429 Too Many Requests"

**Nguyên nhân:**
- Đã vượt quá rate limit (60 calls/minute)

**Giải pháp:**
1. Đợi 1 phút rồi thử lại
2. Script tự động delay 1.1 giây giữa các requests
3. Nếu vẫn lỗi, giảm số lượng wards sync cùng lúc

## Kiểm tra API Key có hoạt động không

Bạn có thể test API key bằng cách gọi trực tiếp:

```bash
curl "http://api.openweathermap.org/data/2.5/weather?lat=10.7769&lon=106.7009&appid=YOUR_API_KEY&units=metric"
```

Thay `YOUR_API_KEY` bằng API key của bạn.

Nếu trả về data JSON thì API key đã hoạt động!

## Tài liệu tham khảo

- OpenWeatherMap API Documentation: https://openweathermap.org/api
- Current Weather API: https://openweathermap.org/current
- API Key Management: https://home.openweathermap.org/api_keys

---

**Sau khi thêm API key, đợi 1-2 giờ rồi chạy script sync! ⏰**

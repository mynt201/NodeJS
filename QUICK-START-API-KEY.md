# ⚡ Quick Start: Thêm OpenWeatherMap API Key

## Bước 1: Lấy API Key (5 phút)

1. **Đăng ký miễn phí:** https://openweathermap.org/api
   - Click "Sign Up" → Điền thông tin → Xác nhận email

2. **Lấy API Key:**
   - Đăng nhập → Vào: https://home.openweathermap.org/api_keys
   - Click "Create key" hoặc "Generate"
   - **Copy API key** (dạng: `abc123def456...`)

3. **⚠️ Đợi 1-2 giờ** để API key được kích hoạt

## Bước 2: Tạo File .env

### Windows:
1. Mở thư mục `flood-risk-backend`
2. Tạo file mới tên `.env` (không có extension)
3. Copy nội dung sau vào file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/flood_risk_db

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d

# OpenWeatherMap API Key - THAY BẰNG API KEY CỦA BẠN
OPENWEATHER_API_KEY=paste_your_api_key_here
```

4. Thay `paste_your_api_key_here` bằng API key bạn đã copy

### Linux/Mac:
```bash
cd flood-risk-backend
cp .env.example .env  # Nếu có file .env.example
# Hoặc tạo file mới
nano .env
```

Thêm dòng:
```env
OPENWEATHER_API_KEY=your_api_key_here
```

## Bước 3: Kiểm tra

Sau khi thêm API key, chạy:

```bash
cd flood-risk-backend
npm run sync-weather
```

Nếu thấy:
- ✅ "Connected to database"
- ✅ "Found X wards"
- ✅ "Processing: ..."

Thì API key đã hoạt động! 🎉

## Ví dụ File .env Hoàn chỉnh:

```env
MONGODB_URI=mongodb://localhost:27017/flood_risk_db
PORT=3000
NODE_ENV=development
JWT_SECRET=my-super-secret-key-12345
JWT_EXPIRE=7d
OPENWEATHER_API_KEY=abc123def456ghi789jkl012mno345pq
```

## ⚠️ Lưu ý:

1. **File .env** phải ở thư mục `flood-risk-backend` (cùng cấp với `package.json`)
2. **Không commit** file `.env` lên Git (đã có trong .gitignore)
3. **Đợi 1-2 giờ** sau khi tạo API key mới có thể dùng
4. **Free tier:** 60 calls/minute, 1M calls/month

## ❌ Nếu gặp lỗi:

### "OPENWEATHER_API_KEY is not configured"
→ Kiểm tra file `.env` có đúng tên và đúng thư mục không

### "401 Unauthorized"
→ API key chưa được kích hoạt, đợi thêm 1-2 giờ

### "429 Too Many Requests"
→ Đã vượt quá rate limit, đợi 1 phút rồi thử lại

---

**Xem hướng dẫn chi tiết:** `HUONG-DAN-LAY-API-KEY.md`

# 🌤️ Weather Data Sync từ OpenWeatherMap API

## Tổng quan

Hệ thống đã được tích hợp với OpenWeatherMap API để tự động lấy dữ liệu thời tiết cho các phường/xã ở Hồ Chí Minh và lưu vào database.

## Cấu hình

### 1. Lấy API Key từ OpenWeatherMap

1. Đăng ký tài khoản miễn phí tại: https://openweathermap.org/api
2. Vào phần API Keys và tạo key mới
3. Copy API key

### 2. Cấu hình Environment Variable

Thêm vào file `.env`:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

**Lưu ý:**
- Free tier: 60 calls/minute, 1,000,000 calls/month
- Cần đợi 1-2 giờ sau khi tạo key để API key được kích hoạt

## API Endpoints

### 1. Sync Weather cho Tất cả Wards ở HCM

**POST** `/api/weather/sync`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "include_forecast": false
}
```

**Query Parameters:**
- `ward_id` (optional): Sync cho một ward cụ thể
- `include_forecast` (optional): Có lấy forecast hay không (default: false)

**Example:**
```bash
POST http://localhost:3000/api/weather/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "include_forecast": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weather sync completed. 50 successful, 0 failed",
  "results": {
    "total_wards": 50,
    "successful": 50,
    "failed": 0,
    "details": {
      "successful": [
        {
          "ward_id": "507f1f77bcf86cd799439012",
          "ward_name": "Phường Bến Nghé",
          "date": "2024-01-15T00:00:00.000Z",
          "type": "current",
          "action": "created",
          "id": "507f1f77bcf86cd799439011"
        }
      ],
      "failed": []
    }
  }
}
```

---

### 2. Sync Weather cho Một Ward Cụ thể

**POST** `/api/weather/sync/:wardId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**URL Parameters:**
- `wardId`: MongoDB ObjectId của ward

**Query Parameters:**
- `include_forecast` (optional): `true` hoặc `false` (default: false)

**Example:**
```bash
POST http://localhost:3000/api/weather/sync/507f1f77bcf86cd799439012?include_forecast=true
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weather data synced successfully",
  "ward": {
    "_id": "507f1f77bcf86cd799439012",
    "ward_name": "Phường Bến Nghé",
    "district": "Quận 1"
  },
  "result": {
    "current": {
      "action": "created",
      "weather": {
        "_id": "507f1f77bcf86cd799439011",
        "ward_id": "507f1f77bcf86cd799439012",
        "date": "2024-01-15T00:00:00.000Z",
        "temperature": {
          "current": 28.5,
          "min": 25.0,
          "max": 32.0
        },
        "humidity": 75,
        "rainfall": 5.2
      }
    },
    "forecast": [
      {
        "date": "2024-01-16T00:00:00.000Z",
        "action": "created",
        "weather": { ... }
      }
    ]
  }
}
```

---

## Cách Sử dụng

### Bước 1: Cấu hình API Key

1. Tạo file `.env` nếu chưa có
2. Thêm `OPENWEATHER_API_KEY=your_key_here`
3. Restart server

### Bước 2: Login as Admin

```bash
POST http://localhost:3000/api/users/login
Body: {
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

→ Copy `token` từ response

### Bước 3: Sync Weather Data

#### Option 1: Sync tất cả wards ở HCM
```bash
POST http://localhost:3000/api/weather/sync
Authorization: Bearer <token>
Body: {
  "include_forecast": false
}
```

#### Option 2: Sync một ward cụ thể
```bash
POST http://localhost:3000/api/weather/sync/507f1f77bcf86cd799439012?include_forecast=true
Authorization: Bearer <token>
```

### Bước 4: Kiểm tra Kết quả

```bash
GET http://localhost:3000/api/weather?ward_id=507f1f77bcf86cd799439012
```

---

## Mapping Data

### OpenWeatherMap → WeatherData Schema

| OpenWeatherMap | WeatherData | Notes |
|---------------|-------------|-------|
| `main.temp` | `temperature.current` | °C |
| `main.temp_min` | `temperature.min` | °C |
| `main.temp_max` | `temperature.max` | °C |
| `main.feels_like` | `temperature.feels_like` | °C |
| `main.humidity` | `humidity` | % |
| `rain.3h` hoặc `rain.1h` | `rainfall` | mm (converted) |
| `wind.speed` | `wind_speed` | m/s → km/h |
| `wind.deg` | `wind_direction` | degrees |
| `wind.gust` | `wind_gust` | m/s → km/h |
| `main.pressure` | `pressure` | hPa |
| `visibility` | `visibility` | m → km |
| `weather[0].main` | `weather_condition.main` | Mapped to enum |
| `weather[0].description` | `weather_condition.description` | Vietnamese |
| `weather[0].icon` | `weather_condition.icon` | Icon code |

### Weather Condition Mapping

OpenWeatherMap có nhiều condition types hơn, được map như sau:

- `Clear` → `Clear`
- `Clouds` → `Clouds`
- `Rain` → `Rain`
- `Drizzle` → `Drizzle`
- `Thunderstorm` → `Thunderstorm`
- `Snow` → `Snow`
- `Mist`, `Fog`, `Haze`, `Smoke`, `Dust`, `Sand`, `Ash` → `Mist` hoặc `Fog`
- `Squall`, `Tornado` → `Thunderstorm`

---

## Tính năng

### 1. Auto-detect Coordinates
- Tự động tính toán tọa độ trung tâm từ ward geometry
- Fallback về tọa độ HCM (10.7769°N, 106.7009°E) nếu không có geometry

### 2. Duplicate Prevention
- Kiểm tra và update nếu weather data đã tồn tại cho cùng ward + date
- Tạo mới nếu chưa có

### 3. Rate Limiting Protection
- Tự động delay 1 giây giữa các requests để tránh vượt quá rate limit
- Free tier: 60 calls/minute

### 4. Forecast Support
- Có thể lấy forecast 5 ngày (3-hour intervals)
- Chỉ lưu forecast cho các ngày tương lai

### 5. Error Handling
- Xử lý lỗi cho từng ward riêng biệt
- Trả về danh sách successful và failed
- Không dừng toàn bộ process nếu một ward lỗi

---

## Lưu ý

1. **API Key Activation**: OpenWeatherMap API key cần 1-2 giờ để được kích hoạt sau khi tạo
2. **Rate Limits**: Free tier giới hạn 60 calls/minute, cần delay giữa các requests
3. **Coordinates**: Nếu ward không có geometry, sẽ dùng tọa độ mặc định của HCM
4. **Date Format**: Weather data được lưu với date = hôm nay (00:00:00)
5. **Forecast**: Forecast data có `is_forecast: true` và `confidence_level: 85`

---

## Troubleshooting

### Lỗi: "OPENWEATHER_API_KEY is not configured"
- Kiểm tra file `.env` có `OPENWEATHER_API_KEY` chưa
- Restart server sau khi thêm env variable

### Lỗi: "401 Unauthorized" từ OpenWeatherMap
- API key chưa được kích hoạt (đợi 1-2 giờ)
- API key không đúng
- Kiểm tra API key trên OpenWeatherMap dashboard

### Lỗi: "429 Too Many Requests"
- Đã vượt quá rate limit (60 calls/minute)
- Đợi 1 phút rồi thử lại
- Hoặc upgrade lên paid plan

### Không có weather data sau khi sync
- Kiểm tra ward có geometry/coordinates không
- Kiểm tra ward có trong database không
- Kiểm tra logs để xem lỗi cụ thể

---

## Ví dụ Sử dụng trong Postman

### 1. Sync tất cả wards
```
POST {{base_url}}/sync
Authorization: Bearer {{token}}
Body: {
  "include_forecast": false
}
```

### 2. Sync một ward với forecast
```
POST {{base_url}}/sync/{{ward_id}}?include_forecast=true
Authorization: Bearer {{token}}
```

### 3. Kiểm tra weather data đã sync
```
GET {{base_url}}?ward_id={{ward_id}}&sort=date&order=desc
```

---

**Happy Syncing! 🌤️**

# 🚀 Postman Quick Start Guide - Weather API

## Cách Import Collection vào Postman

### Bước 1: Import Collection
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `Flood-Risk-Weather-API.postman_collection.json`
4. Click **Import**

### Bước 2: Tạo Environment
1. Click **Environments** (bên trái)
2. Click **+** để tạo environment mới
3. Đặt tên: `Flood Risk API`
4. Thêm các variables:
   - `base_url`: `http://localhost:3000/api/weather`
   - `token`: (để trống, sẽ tự động lưu sau khi login)
   - `ward_id`: (để trống, sẽ lấy từ wards API)
5. Click **Save**

### Bước 3: Chọn Environment
- Ở góc trên bên phải, chọn environment: **Flood Risk API**

## 📝 Testing Workflow

### Step 1: Get Ward ID (Quan trọng!)
Trước khi test weather endpoints, bạn cần có Ward ID:

1. Tạo request mới hoặc sử dụng Wards API:
   ```
   GET http://localhost:3000/api/wards
   ```
2. Copy một `_id` từ response
3. Update environment variable `ward_id` với giá trị vừa copy

**Hoặc trong Postman:**
- Vào **Environments** → **Flood Risk API**
- Update `ward_id` = `<paste_ward_id_here>`

### Step 2: Test Public Endpoints

#### 2.1 Get Weather Data
```
GET {{base_url}}
```
- Test với các query parameters:
  - `page=1&limit=20`
  - `ward_id={{ward_id}}`
  - `date_from=2024-01-01T00:00:00.000Z&date_to=2024-12-31T23:59:59.999Z`
  - `is_forecast=false`

#### 2.2 Get Latest Weather
```
GET {{base_url}}/latest
```
- Lấy weather mới nhất cho tất cả wards

#### 2.3 Get Weather by Ward
```
GET {{base_url}}/ward/{{ward_id}}
```
- Lấy weather data cho một ward cụ thể
- Có thể thêm query: `?page=1&limit=30`

#### 2.4 Get Weather Statistics
```
GET {{base_url}}/stats/{{ward_id}}?days=30
```
- Xem thống kê weather cho một ward
- `days` có thể là 7, 30, 90, 365

### Step 3: Login as Admin (Để test Admin endpoints)

1. Sử dụng User API collection hoặc tạo request mới:
   ```
   POST http://localhost:3000/api/users/login
   Body: {
     "email": "admin@example.com",
     "password": "AdminPass123"
   }
   ```
2. Copy `token` từ response
3. Update environment variable `token` với giá trị vừa copy

**Hoặc tự động:**
- Collection có test script để tự động lưu token sau khi login

### Step 4: Test Admin Endpoints

#### 4.1 Create Weather Data
```
POST {{base_url}}
Authorization: Bearer {{token}}
Body: {
  "ward_id": "{{ward_id}}",
  "date": "2024-01-15T00:00:00.000Z",
  "temperature": {
    "current": 28.5,
    "min": 25.0,
    "max": 32.0
  },
  "humidity": 75,
  "rainfall": 5.2
}
```

#### 4.2 Update Weather Data
1. Tạo weather data trước (Step 4.1)
2. Copy `_id` từ response
3. Update weather data:
   ```
   PUT {{base_url}}/:id
   Body: {
     "temperature": {
       "current": 30.0
     },
     "humidity": 80
   }
   ```

#### 4.3 Delete Weather Data
```
DELETE {{base_url}}/:id
```

#### 4.4 Bulk Import Weather Data
```
POST {{base_url}}/bulk-import
Body: {
  "weatherData": [
    {
      "ward_id": "{{ward_id}}",
      "date": "2024-01-15T00:00:00.000Z",
      "humidity": 75,
      "rainfall": 5.2
    },
    {
      "ward_id": "{{ward_id}}",
      "date": "2024-01-16T00:00:00.000Z",
      "humidity": 70,
      "rainfall": 0
    }
  ]
}
```

## 🔧 Manual Testing (Nếu không dùng Collection)

### 1. Get Ward ID
```
GET http://localhost:3000/api/wards
```
→ Copy một `_id` từ response

### 2. Get Weather Data
```
GET http://localhost:3000/api/weather?ward_id=<ward_id>&page=1&limit=20
```

### 3. Create Weather Data
```
POST http://localhost:3000/api/weather
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "ward_id": "<ward_id>",
  "date": "2024-01-15T00:00:00.000Z",
  "humidity": 75,
  "rainfall": 5.2
}
```

## ✅ Validation Rules

### Required Fields (Create)
- `ward_id`: MongoDB ObjectId
- `date`: ISO8601 date format
- `humidity`: Number 0-100
- `rainfall`: Number >= 0

### Optional Fields
- `temperature.current`: -50 to 60°C
- `temperature.min`: -50 to 60°C
- `temperature.max`: -50 to 60°C
- `temperature.feels_like`: -50 to 60°C
- `wind_speed`: >= 0
- `wind_direction`: 0-360 degrees
- `wind_gust`: >= 0
- `pressure`: 800-1200 hPa
- `visibility`: >= 0 km
- `weather_condition.main`: Clear, Clouds, Rain, Drizzle, Thunderstorm, Snow, Mist, Fog
- `uv_index`: 0-11
- `aqi`: 0-500
- `data_source`: weather_api, manual, sensor, forecast
- `is_forecast`: Boolean
- `confidence_level`: 0-100

## 🐛 Common Issues

### 400 Bad Request - Validation Error
- Kiểm tra validation rules
- Xem response để biết field nào bị lỗi
- Đảm bảo date format là ISO8601: `2024-01-15T00:00:00.000Z`

### 401 Unauthorized
- Kiểm tra token có đúng không
- Token có thể đã hết hạn
- Login lại để lấy token mới

### 403 Forbidden
- Endpoint yêu cầu admin role
- Đảm bảo bạn đang login với admin account

### 404 Not Found
- Kiểm tra weather ID có tồn tại không
- Kiểm tra ward ID có tồn tại không

### 409 Conflict
- Weather data cho cùng ward và date đã tồn tại
- Sử dụng update thay vì create

## 💡 Tips

1. **Ward ID First**: Luôn lấy ward_id trước khi test weather endpoints
2. **Date Format**: Sử dụng ISO8601: `2024-01-15T00:00:00.000Z`
3. **Duplicate Check**: Weather data cho cùng ward + date sẽ bị reject
4. **Bulk Import**: Có thể import nhiều records, kết quả sẽ cho biết successful/failed/duplicates
5. **Query Parameters**: Sử dụng tab Params trong Postman để dễ dàng thêm query parameters
6. **Environment Variables**: Sử dụng `{{base_url}}`, `{{token}}`, `{{ward_id}}` trong requests

## 📊 Example Use Cases

### Use Case 1: Get Today's Weather
```
GET /api/weather?date_from=2024-01-15T00:00:00.000Z&date_to=2024-01-15T23:59:59.999Z&is_forecast=false
```

### Use Case 2: Get Weather Forecast
```
GET /api/weather?is_forecast=true&sort=date&order=asc
```

### Use Case 3: Get High Rainfall Days
```
GET /api/weather?sort=rainfall&order=desc&limit=10
```

### Use Case 4: Get Weekly Weather for Ward
```
GET /api/weather/ward/{{ward_id}}?limit=7&sort=date&order=desc
```

### Use Case 5: Get Monthly Statistics
```
GET /api/weather/stats/{{ward_id}}?days=30
```

## 🔗 Related APIs

- **Wards API**: `http://localhost:3000/api/wards` - Để lấy ward_id
- **User API**: `http://localhost:3000/api/users` - Để login và lấy token

## 📚 Full Documentation

Xem file `API-DOCUMENTATION-WEATHER-POSTMAN.md` để biết chi tiết về:
- Tất cả endpoints với examples
- Request/Response formats
- Error handling
- Validation rules chi tiết

---

**Happy Testing! 🎉**

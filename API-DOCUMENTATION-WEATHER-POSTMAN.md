# 📚 API Documentation - Weather Controller
## Postman Testing Guide

**Base URL:** `http://localhost:3000/api/weather`

**Authentication:** Bearer Token (JWT) - Required for Admin endpoints only
- Format: `Authorization: Bearer <token>`
- Token được trả về từ `/api/users/login` hoặc `/api/users/register`

---

## 🔓 Public Endpoints (Không cần authentication)

### 1. Get Weather Data
**GET** `/api/weather`

**Headers:**
```
(No headers required)
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `ward_id` (optional): Filter by ward ID (MongoDB ObjectId)
- `date_from` (optional): ISO8601 date - Filter weather data from this date
- `date_to` (optional): ISO8601 date - Filter weather data until this date
- `is_forecast` (optional): Filter by forecast status - `true` or `false`
- `sort` (optional): Sort field - `date`, `temperature.current`, `rainfall`, `humidity`, `createdAt` (default: `date`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Example URLs:**
```
GET /api/weather
GET /api/weather?page=1&limit=20
GET /api/weather?ward_id=507f1f77bcf86cd799439011
GET /api/weather?date_from=2024-01-01T00:00:00.000Z&date_to=2024-12-31T23:59:59.999Z
GET /api/weather?ward_id=507f1f77bcf86cd799439011&is_forecast=false&sort=date&order=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "weatherData": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ward_id": {
        "_id": "507f1f77bcf86cd799439012",
        "ward_name": "Ward 1",
        "district": "District 1"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "temperature": {
        "current": 28.5,
        "min": 25.0,
        "max": 32.0,
        "feels_like": 30.0
      },
      "humidity": 75,
      "rainfall": 5.2,
      "wind_speed": 15.5,
      "wind_direction": 180,
      "wind_gust": 20.0,
      "pressure": 1013.25,
      "visibility": 10.0,
      "weather_condition": {
        "main": "Rain",
        "description": "Light rain",
        "icon": "10d"
      },
      "uv_index": 5,
      "aqi": 50,
      "data_source": "weather_api",
      "is_forecast": false,
      "confidence_level": 100,
      "recorded_at": "2024-01-15T08:00:00.000Z",
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Weather Data by ID
**GET** `/api/weather/:id`

**Headers:**
```
(No headers required)
```

**URL Parameters:**
- `id`: MongoDB ObjectId của weather data

**Example:**
```
GET /api/weather/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "weather": {
    "_id": "507f1f77bcf86cd799439011",
    "ward_id": {
      "_id": "507f1f77bcf86cd799439012",
      "ward_name": "Ward 1",
      "district": "District 1",
      "coordinates": {
        "lat": 10.7769,
        "lng": 106.7009
      }
    },
    "date": "2024-01-15T00:00:00.000Z",
    "temperature": {
      "current": 28.5,
      "min": 25.0,
      "max": 32.0,
      "feels_like": 30.0
    },
    "humidity": 75,
    "rainfall": 5.2,
    "wind_speed": 15.5,
    "wind_direction": 180,
    "wind_gust": 20.0,
    "pressure": 1013.25,
    "visibility": 10.0,
    "weather_condition": {
      "main": "Rain",
      "description": "Light rain",
      "icon": "10d"
    },
    "uv_index": 5,
    "aqi": 50,
    "data_source": "weather_api",
    "is_forecast": false,
    "confidence_level": 100
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Weather data not found"
}
```

---

### 3. Get Weather Data by Ward
**GET** `/api/weather/ward/:wardId`

**Headers:**
```
(No headers required)
```

**URL Parameters:**
- `wardId`: MongoDB ObjectId của ward

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30, max: 100)
- `date_from` (optional): ISO8601 date - Filter from this date
- `date_to` (optional): ISO8601 date - Filter until this date

**Example:**
```
GET /api/weather/ward/507f1f77bcf86cd799439012?page=1&limit=30
GET /api/weather/ward/507f1f77bcf86cd799439012?date_from=2024-01-01T00:00:00.000Z&date_to=2024-01-31T23:59:59.999Z
```

**Success Response (200):**
```json
{
  "success": true,
  "ward": {
    "_id": "507f1f77bcf86cd799439012",
    "ward_name": "Ward 1",
    "district": "District 1"
  },
  "weatherData": [
    {
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
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 50,
    "pages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 4. Get Latest Weather Data for All Wards
**GET** `/api/weather/latest`

**Headers:**
```
(No headers required)
```

**Success Response (200):**
```json
{
  "success": true,
  "latestWeather": [
    {
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
  ],
  "count": 10
}
```

---

### 5. Get Weather Statistics for a Ward
**GET** `/api/weather/stats/:wardId`

**Headers:**
```
(No headers required)
```

**URL Parameters:**
- `wardId`: MongoDB ObjectId của ward

**Query Parameters:**
- `days` (optional): Number of days to calculate statistics (default: 30, max: 365)

**Example:**
```
GET /api/weather/stats/507f1f77bcf86cd799439012
GET /api/weather/stats/507f1f77bcf86cd799439012?days=7
GET /api/weather/stats/507f1f77bcf86cd799439012?days=90
```

**Success Response (200):**
```json
{
  "success": true,
  "ward": {
    "_id": "507f1f77bcf86cd799439012",
    "ward_name": "Ward 1",
    "district": "District 1"
  },
  "period": {
    "days": 30,
    "startDate": "2023-12-16T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z"
  },
  "statistics": {
    "count": 30,
    "avgTemperature": 27.5,
    "maxTemperature": 35.0,
    "minTemperature": 20.0,
    "avgHumidity": 70.5,
    "totalRainfall": 150.5,
    "avgRainfall": 5.02,
    "maxRainfall": 25.0,
    "rainyDays": 15
  }
}
```

---

## 🔒 Admin Only Endpoints (Cần authentication)

### 6. Create Weather Data
**POST** `/api/weather`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "ward_id": "507f1f77bcf86cd799439012",
  "date": "2024-01-15T00:00:00.000Z",
  "temperature": {
    "current": 28.5,
    "min": 25.0,
    "max": 32.0,
    "feels_like": 30.0
  },
  "humidity": 75,
  "rainfall": 5.2,
  "wind_speed": 15.5,
  "wind_direction": 180,
  "wind_gust": 20.0,
  "pressure": 1013.25,
  "visibility": 10.0,
  "weather_condition": {
    "main": "Rain",
    "description": "Light rain",
    "icon": "10d"
  },
  "uv_index": 5,
  "aqi": 50,
  "data_source": "weather_api",
  "is_forecast": false,
  "confidence_level": 100
}
```

**Required Fields:**
- `ward_id`: MongoDB ObjectId (required)
- `date`: ISO8601 date (required)
- `humidity`: Number 0-100 (required)
- `rainfall`: Number >= 0 (required)

**Optional Fields:**
- `temperature.current`: Number -50 to 60
- `temperature.min`: Number -50 to 60
- `temperature.max`: Number -50 to 60
- `temperature.feels_like`: Number -50 to 60
- `wind_speed`: Number >= 0
- `wind_direction`: Number 0-360
- `wind_gust`: Number >= 0
- `pressure`: Number 800-1200
- `visibility`: Number >= 0
- `weather_condition.main`: Enum - `Clear`, `Clouds`, `Rain`, `Drizzle`, `Thunderstorm`, `Snow`, `Mist`, `Fog`
- `weather_condition.description`: String max 200 chars
- `weather_condition.icon`: String max 10 chars
- `uv_index`: Number 0-11
- `aqi`: Number 0-500
- `data_source`: Enum - `weather_api`, `manual`, `sensor`, `forecast`
- `is_forecast`: Boolean
- `confidence_level`: Number 0-100

**Success Response (201):**
```json
{
  "success": true,
  "message": "Weather data created successfully",
  "weather": {
    "_id": "507f1f77bcf86cd799439011",
    "ward_id": "507f1f77bcf86cd799439012",
    "date": "2024-01-15T00:00:00.000Z",
    "temperature": {
      "current": 28.5,
      "min": 25.0,
      "max": 32.0,
      "feels_like": 30.0
    },
    "humidity": 75,
    "rainfall": 5.2,
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "temperature.current",
      "message": "Current temperature must be between -50°C and 60°C",
      "value": 100
    }
  ]
}
```

---

### 7. Update Weather Data
**PUT** `/api/weather/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: MongoDB ObjectId của weather data

**Body (JSON):** - Tất cả fields đều optional
```json
{
  "temperature": {
    "current": 30.0,
    "max": 35.0
  },
  "humidity": 80,
  "rainfall": 10.5,
  "weather_condition": {
    "main": "Thunderstorm",
    "description": "Heavy thunderstorm"
  }
}
```

**Example:**
```
PUT /api/weather/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weather data updated successfully",
  "weather": {
    "_id": "507f1f77bcf86cd799439011",
    "ward_id": {
      "_id": "507f1f77bcf86cd799439012",
      "ward_name": "Ward 1",
      "district": "District 1"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "temperature": {
      "current": 30.0,
      "min": 25.0,
      "max": 35.0
    },
    "humidity": 80,
    "rainfall": 10.5
  }
}
```

---

### 8. Delete Weather Data
**DELETE** `/api/weather/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**URL Parameters:**
- `id`: MongoDB ObjectId của weather data

**Example:**
```
DELETE /api/weather/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weather data deleted successfully"
}
```

---

### 9. Sync Weather Data from OpenWeatherMap API
**POST** `/api/weather/sync`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "ward_id": "507f1f77bcf86cd799439012",
  "include_forecast": false
}
```

**Query Parameters:**
- `ward_id` (optional): Sync cho một ward cụ thể, nếu không có sẽ sync tất cả wards ở HCM
- `include_forecast` (optional): Có lấy forecast hay không (default: false)

**Note:** Cần cấu hình `OPENWEATHER_API_KEY` trong `.env` file

**Example:**
```
POST /api/weather/sync
Body: {
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
          "action": "created"
        }
      ],
      "failed": []
    }
  }
}
```

---

### 10. Sync Weather Data for Specific Ward
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
```
POST /api/weather/sync/507f1f77bcf86cd799439012?include_forecast=true
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

**Error Response (400):**
```json
{
  "success": false,
  "error": "OpenWeatherMap API key is not configured. Please set OPENWEATHER_API_KEY in environment variables."
}
```

---

### 11. Bulk Import Weather Data
**POST** `/api/weather/bulk-import`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "weatherData": [
    {
      "ward_id": "507f1f77bcf86cd799439012",
      "date": "2024-01-15T00:00:00.000Z",
      "temperature": {
        "current": 28.5,
        "min": 25.0,
        "max": 32.0
      },
      "humidity": 75,
      "rainfall": 5.2
    },
    {
      "ward_id": "507f1f77bcf86cd799439012",
      "date": "2024-01-16T00:00:00.000Z",
      "temperature": {
        "current": 29.0,
        "min": 26.0,
        "max": 33.0
      },
      "humidity": 70,
      "rainfall": 0
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bulk import completed. 2 successful, 0 failed, 0 duplicates",
  "results": {
    "successful": [
      {
        "id": "507f1f77bcf86cd799439011",
        "ward_name": "Ward 1",
        "date": "2024-01-15T00:00:00.000Z"
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "ward_name": "Ward 1",
        "date": "2024-01-16T00:00:00.000Z"
      }
    ],
    "failed": [],
    "duplicates": []
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "weatherData.0.ward_id",
      "message": "Ward ID is required for each weather data item",
      "value": null
    }
  ]
}
```

---

## 📋 Validation Rules

### Temperature
- `current`, `min`, `max`, `feels_like`: -50°C to 60°C

### Humidity
- Required: Yes
- Range: 0% to 100%

### Rainfall
- Required: Yes
- Range: >= 0 mm

### Wind
- `wind_speed`: >= 0 km/h
- `wind_direction`: 0-360 degrees
- `wind_gust`: >= 0 km/h

### Pressure
- Range: 800-1200 hPa

### Visibility
- Range: >= 0 km

### Weather Condition
- `main`: Enum - `Clear`, `Clouds`, `Rain`, `Drizzle`, `Thunderstorm`, `Snow`, `Mist`, `Fog`
- `description`: Max 200 characters
- `icon`: Max 10 characters

### UV Index
- Range: 0-11

### AQI (Air Quality Index)
- Range: 0-500

### Data Source
- Enum: `weather_api`, `manual`, `sensor`, `forecast`

### Confidence Level
- Range: 0-100

---

## 🔐 Authentication Header Format

Tất cả các admin endpoints đều cần header:
```
Authorization: Bearer <token>
```

**Lấy token:**
1. Đăng nhập: `POST /api/users/login` → nhận token trong response
2. Đăng ký: `POST /api/users/register` → nhận token trong response

**Copy token và paste vào Postman:**
- Vào tab **Authorization**
- Chọn type: **Bearer Token**
- Paste token vào field **Token**

---

## 📝 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "temperature.current",
      "message": "Current temperature must be between -50°C and 60°C",
      "value": 100
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Role 'user' is not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Weather data not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Weather data for this ward and date already exists"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server error retrieving weather data"
}
```

---

## 🧪 Testing Workflow trong Postman

### Step 1: Get Ward ID
Trước tiên, bạn cần có Ward ID để test weather endpoints:
```
GET http://localhost:3000/api/wards
```
→ Copy một `_id` từ response

### Step 2: Test Public Endpoints
1. **Get Weather Data** - Test với các query parameters
2. **Get Latest Weather** - Lấy weather mới nhất cho tất cả wards
3. **Get Weather by Ward** - Test với ward ID đã lấy
4. **Get Weather Stats** - Xem thống kê weather cho một ward

### Step 3: Login as Admin
```
POST http://localhost:3000/api/users/login
Body: {
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```
→ Copy `token` từ response

### Step 4: Set Environment Variable
Trong Postman:
- Tạo Environment: `Flood Risk API`
- Thêm variable: `token` = `<paste_token_here>`
- Thêm variable: `base_url` = `http://localhost:3000/api/weather`
- Thêm variable: `ward_id` = `<ward_id_from_step_1>`

### Step 5: Test Admin Endpoints
- **Create Weather Data** - Tạo weather data mới
- **Update Weather Data** - Cập nhật weather data
- **Delete Weather Data** - Xóa weather data
- **Bulk Import** - Import nhiều weather data cùng lúc

---

## 💡 Tips

1. **Date Format**: Sử dụng ISO8601 format: `2024-01-15T00:00:00.000Z`
2. **Ward ID**: Đảm bảo ward ID tồn tại trước khi tạo weather data
3. **Duplicate Check**: Weather data cho cùng ward và date sẽ bị reject (409 error)
4. **Pagination**: Sử dụng `page` và `limit` để phân trang
5. **Filters**: Kết hợp nhiều filters để tìm kiếm chính xác
6. **Bulk Import**: Có thể import nhiều records cùng lúc, kết quả sẽ cho biết số lượng successful/failed/duplicates

---

## 📊 Example Use Cases

### Use Case 1: Get Weather for Today
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

### Use Case 4: Get Weather for Specific Ward
```
GET /api/weather/ward/507f1f77bcf86cd799439012?limit=7&sort=date&order=desc
```

### Use Case 5: Get Monthly Statistics
```
GET /api/weather/stats/507f1f77bcf86cd799439012?days=30
```

---

**Happy Testing! 🚀**

# Flood Risk Management System - API Documentation

## 📋 Tổng quan

Hệ thống quản lý rủi ro ngập lụt cung cấp REST API đầy đủ để quản lý dữ liệu về thời tiết, hệ thống thoát nước, cầu đường, và đánh giá rủi ro ngập lụt.

## 🔐 Authentication

### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@floodrisk.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "admin@floodrisk.com",
    "role": "admin",
    "fullName": "System Administrator"
  }
}
```

### Register
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

## 👤 User Management

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "phone": "+0987654321",
  "address": "New Address"
}
```

### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Admin: Get All Users
```http
GET /api/users?page=1&limit=10&role=admin&search=johndoe
Authorization: Bearer <token> (Admin only)
```

### Admin: Update User
```http
PUT /api/users/:id
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "role": "user",
  "isActive": true,
  "fullName": "Updated Name"
}
```

## 🏘️ Ward Management (Phường/Xã)

### Get All Wards
```http
GET /api/wards?page=1&limit=10&district=District1&province=HCMC
```

### Get Ward by ID
```http
GET /api/wards/:id
```

### Get Ward Statistics
```http
GET /api/wards/stats
```

### Get Wards by Risk Level
```http
GET /api/wards/risk/high
```

### Admin: Create Ward
```http
POST /api/wards
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "ward_name": "Ben Nghe",
  "district": "District 1",
  "province": "Ho Chi Minh City",
  "population_density": 15000,
  "rainfall": 1800,
  "low_elevation": 2.5,
  "urban_land": 85,
  "drainage_capacity": 6.5
}
```

### Admin: Update Ward
```http
PUT /api/wards/:id
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "population_density": 16000,
  "rainfall": 1900
}
```

### Admin: Calculate Risk
```http
POST /api/wards/:id/calculate-risk
Authorization: Bearer <token> (Admin only)
```

## 🌤️ Weather Data

### Get Weather Data
```http
GET /api/weather?page=1&limit=10&ward_id=ward_id_here
```

### Get Latest Weather for All Wards
```http
GET /api/weather/latest
```

### Get Weather by Ward
```http
GET /api/weather/ward/:wardId?start=2024-01-01&end=2024-01-31
```

### Get Weather Statistics
```http
GET /api/weather/stats/:wardId
```

### Admin: Create Weather Data
```http
POST /api/weather
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "ward_id": "ward_id_here",
  "date": "2024-01-08",
  "temperature": 28.5,
  "humidity": 78,
  "rainfall": 15.5,
  "wind_speed": 12.5
}
```

## 🚰 Drainage Systems

### Get Drainage Systems
```http
GET /api/drainage?page=1&limit=10&type=canal&condition=good
```

### Admin: Create Drainage System
```http
POST /api/drainage
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "ward_id": "ward_id_here",
  "name": "Main Canal",
  "type": "canal",
  "coordinates": {
    "latitude": 10.772,
    "longitude": 106.690
  },
  "design_capacity": 25.5,
  "condition": "good",
  "efficiency_percentage": 86.7
}
```

### Admin: Update Drainage System
```http
PUT /api/drainage/:id
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "condition": "fair",
  "efficiency_percentage": 75.2
}
```

## 🛣️ Road & Bridge Infrastructure

### Get Infrastructure Data
```http
GET /api/road-bridge?page=1&limit=10&type=road&condition=good
```

### Admin: Create Infrastructure
```http
POST /api/road-bridge
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "ward_id": "ward_id_here",
  "name": "Ham Nghi Boulevard",
  "type": "boulevard",
  "coordinates": {
    "start_latitude": 10.771,
    "start_longitude": 106.688,
    "end_latitude": 10.775,
    "end_longitude": 106.692
  },
  "flood_level": 3.2,
  "condition": "good",
  "criticality_level": "high"
}
```

## 📊 Risk Index Data

### Get Risk Data
```http
GET /api/risk?page=1&limit=10&ward_id=ward_id_here
```

### Get Risk by Ward
```http
GET /api/risk/ward/:wardId?start=2024-01-01&end=2024-01-31
```

### Admin: Create Risk Assessment
```http
POST /api/risk
Authorization: Bearer <token> (Admin only)
Content-Type: application/json

{
  "ward_id": "ward_id_here",
  "date": "2024-01-08",
  "risk_index": 6.2,
  "exposure": 7.8,
  "susceptibility": 6.5,
  "resilience": 4.2,
  "risk_category": "High"
}
```

## ⚙️ Settings Management

### Get User Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

### Update Settings
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "vi",
  "dashboard": {
    "defaultView": "dashboard",
    "refreshInterval": 300
  },
  "riskThresholds": {
    "veryLow": 2,
    "low": 4,
    "medium": 6,
    "high": 8,
    "veryHigh": 9
  }
}
```

### Update Notifications
```http
PUT /api/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email",
  "settings": {
    "enabled": true,
    "types": {
      "floodAlerts": true,
      "systemUpdates": true
    }
  }
}
```

### Reset to Defaults
```http
POST /api/settings/reset
Authorization: Bearer <token>
```

### Get Default Settings
```http
GET /api/settings/defaults
```

### Admin: Get System Statistics
```http
GET /api/settings/stats
Authorization: Bearer <token> (Admin only)
```

## 🔍 Search & Filtering

Hầu hết các endpoints hỗ trợ query parameters:

- `page`: Số trang (default: 1)
- `limit`: Số items per page (default: 10, max: 100)
- `sort`: Field để sort
- `order`: 'asc' hoặc 'desc'
- `search`: Từ khóa tìm kiếm

Ví dụ:
```http
GET /api/users?page=1&limit=20&sort=createdAt&order=desc&search=admin
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "success": true,
  "users": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ]
}
```

## 🔐 Authentication & Authorization

- **Bearer Token**: Gửi trong header `Authorization: Bearer <token>`
- **Admin Only**: Một số endpoints yêu cầu role admin
- **Protected**: Phần lớn endpoints yêu cầu authentication

## 📝 Data Validation

Tất cả input được validate:
- Required fields
- Data types
- Value ranges
- Format validation (email, phone, etc.)

## 🧪 Testing

### Test Accounts
- **Admin**: `admin@floodrisk.com` / `admin123`
- **Manager**: `manager@floodrisk.com` / `admin123`
- **Officer**: `officer@floodrisk.com` / `admin123`
- **Researcher**: `researcher@university.edu.vn` / `admin123`

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "uptime": 123.45,
  "database": {
    "status": "Connected",
    "name": "flood_risk_db"
  }
}
```

## 🚀 Getting Started

1. **Start Backend**: `npm start` or `npm run dev`
2. **Check Health**: `GET /api/health`
3. **Login**: `POST /api/users/login`
4. **Explore APIs**: Sử dụng các endpoints ở trên

## 📞 Support

API được thiết kế để tương thích với React frontend và hỗ trợ đầy đủ các chức năng của hệ thống quản lý rủi ro ngập lụt.

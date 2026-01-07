# Flood Risk Backend API

Backend API cho hệ thống quản lý rủi ro ngập lụt TP.HCM được xây dựng bằng Node.js, Express và MongoDB.

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc với nội dung:

```env
# Database Configuration
DATABASE_URL=mongodb://localhost:27017/flood_risk_db

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=flood_risk_jwt_secret_key_2024
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Khởi động MongoDB

Đảm bảo MongoDB đang chạy trên máy local (port 27017).

### 4. Chạy server

```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

## 📋 Tài khoản Admin Mặc định

Khi khởi động server lần đầu, hệ thống sẽ tự động tạo tài khoản admin mặc định:

- **Email**: `admin@floodrisk.com`
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

⚠️ **Quan trọng**: Hãy đổi mật khẩu mặc định sau lần đăng nhập đầu tiên!

## 📚 API Endpoints

### Authentication

- `POST /api/users/register` - Đăng ký user mới
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/profile` - Lấy thông tin profile (yêu cầu auth)
- `PUT /api/users/profile` - Cập nhật profile (yêu cầu auth)
- `PUT /api/users/change-password` - Đổi mật khẩu (yêu cầu auth)

### User Management (Admin only)

- `GET /api/users` - Lấy danh sách users
- `GET /api/users/stats` - Thống kê users
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Ward Management

- `GET /api/wards` - Lấy danh sách phường/xã
- `GET /api/wards/stats` - Thống kê phường/xã
- `GET /api/wards/:id` - Lấy thông tin phường/xã theo ID
- `POST /api/wards` - Tạo phường/xã mới
- `PUT /api/wards/:id` - Cập nhật phường/xã
- `DELETE /api/wards/:id` - Xóa phường/xã

### Weather Data

- `GET /api/weather` - Lấy dữ liệu thời tiết
- `POST /api/weather` - Tạo dữ liệu thời tiết mới
- `PUT /api/weather/:id` - Cập nhật dữ liệu thời tiết
- `DELETE /api/weather/:id` - Xóa dữ liệu thời tiết

### Drainage Data

- `GET /api/drainage` - Lấy dữ liệu thoát nước
- `POST /api/drainage` - Tạo dữ liệu thoát nước mới
- `PUT /api/drainage/:id` - Cập nhật dữ liệu thoát nước
- `DELETE /api/drainage/:id` - Xóa dữ liệu thoát nước

### Risk Index Data

- `GET /api/risk` - Lấy dữ liệu chỉ số rủi ro
- `POST /api/risk` - Tạo dữ liệu chỉ số rủi ro mới
- `PUT /api/risk/:id` - Cập nhật dữ liệu chỉ số rủi ro
- `DELETE /api/risk/:id` - Xóa dữ liệu chỉ số rủi ro

### Road & Bridge Data

- `GET /api/road-bridge` - Lấy dữ liệu đường sá và cầu
- `POST /api/road-bridge` - Tạo dữ liệu đường sá và cầu mới
- `PUT /api/road-bridge/:id` - Cập nhật dữ liệu đường sá và cầu
- `DELETE /api/road-bridge/:id` - Xóa dữ liệu đường sá và cầu

### Settings

- `GET /api/settings` - Lấy cài đặt hệ thống
- `PUT /api/settings` - Cập nhật cài đặt hệ thống

## 🔧 Kiểm tra trạng thái

Truy cập `http://localhost:3000/api/health` để kiểm tra trạng thái server và kết nối database.

## 🗄️ Cấu trúc Database

### User Collection

```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: 'admin' | 'user',
  fullName: String,
  phone: String,
  address: String,
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Ward Collection

```javascript
{
  ward_name: String,
  geometry: {
    type: 'polygon',
    rings: [[[number, number]]]
  },
  population_density: Number,
  rainfall: Number,
  low_elevation: Number,
  urban_land: Number,
  drainage_capacity: Number
}
```

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Token được trả về sau khi đăng nhập thành công và phải được gửi trong header `Authorization: Bearer <token>` cho các API yêu cầu authentication.

## 📊 Response Format

Tất cả API responses đều có format chuẩn:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // for list endpoints
}
```

## 🚨 Error Handling

API sử dụng error codes chuẩn:

- `200` - Thành công
- `201` - Tạo mới thành công
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 License

MIT License

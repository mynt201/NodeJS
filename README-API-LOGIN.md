# API Login Documentation

## 📝 Tổng quan

API đăng nhập đã được cập nhật để sử dụng **email và password** thay vì username và password.

## 🔐 API Endpoint

```
POST /api/users/login
```

## 📥 Request Body

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | Email address của user (sẽ được normalize thành lowercase) |
| `password` | string | ✅ | Mật khẩu của user |

## 📤 Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "lastLogin": "2024-01-08T10:30:00.000Z",
    "displayName": "John Doe"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing fields
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

#### 401 Unauthorized - Invalid credentials
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### 401 Unauthorized - Account deactivated
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```

#### 400 Bad Request - Validation failed
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "invalid-email"
    }
  ]
}
```

## 🔧 Cách sử dụng Token

Sau khi đăng nhập thành công, sử dụng token trong header cho các API requests:

```
Authorization: Bearer <your_jwt_token>
```

### Ví dụ với curl:

```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@floodrisk.com",
    "password": "admin123"
  }'

# Sử dụng token cho API khác
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 📋 Validation Rules

- **Email**: Phải là email hợp lệ, tự động chuyển thành lowercase và trim
- **Password**: Bắt buộc, không được để trống

## 🔒 Bảo mật

- Password được hash bằng bcrypt
- JWT token có thời hạn 7 ngày (có thể cấu hình trong .env)
- Token chứa thông tin user ID và role
- Account phải active mới có thể đăng nhập

## 🧪 Testing

### Tài khoản test có sẵn:

| Email | Password | Role |
|-------|----------|------|
| admin@floodrisk.com | admin123 | admin |
| manager@floodrisk.com | admin123 | user |
| officer@floodrisk.com | admin123 | user |
| researcher@university.edu.vn | admin123 | user |

### Ví dụ test với Postman:

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/users/login`
3. **Headers**:
   - Content-Type: application/json
4. **Body** (raw JSON):
   ```json
   {
     "email": "admin@floodrisk.com",
     "password": "admin123"
   }
   ```

## ⚠️ Lưu ý quan trọng

1. **Case sensitive**: Email được chuyển thành lowercase tự động
2. **Rate limiting**: Nên implement rate limiting cho login endpoint trong production
3. **Account lockout**: Có thể thêm logic khóa tài khoản sau nhiều lần đăng nhập thất bại
4. **Two-factor authentication**: Có thể mở rộng để hỗ trợ 2FA trong tương lai

## 🔄 Migration từ Username

Nếu hệ thống cũ sử dụng username, bạn có thể:

1. Cập nhật frontend để sử dụng email thay vì username
2. Thông báo cho users về việc chuyển đổi
3. Có thể support cả email và username trong thời gian chuyển tiếp

## 📞 Support

Nếu gặp vấn đề với API login:

1. Kiểm tra server đang chạy: `http://localhost:3000/api/health`
2. Kiểm tra MongoDB connection
3. Xem server logs để debug
4. Đảm bảo email và password chính xác

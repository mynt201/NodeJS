# 🚀 Postman Quick Start Guide

## Cách Import Collection vào Postman

### Bước 1: Import Collection
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `Flood-Risk-User-API.postman_collection.json`
4. Click **Import**

### Bước 2: Tạo Environment
1. Click **Environments** (bên trái)
2. Click **+** để tạo environment mới
3. Đặt tên: `Flood Risk API`
4. Thêm các variables:
   - `base_url`: `http://localhost:3000/api/users`
   - `token`: (để trống, sẽ tự động lưu sau khi login/register)
5. Click **Save**

### Bước 3: Chọn Environment
- Ở góc trên bên phải, chọn environment: **Flood Risk API**

## 📝 Testing Workflow

### 1. Register User (Lấy token đầu tiên)
1. Mở collection: **Flood Risk - User API**
2. Vào folder: **Public Endpoints**
3. Chọn request: **Register User**
4. Click **Send**
5. Token sẽ tự động được lưu vào environment variable `token`

**Body mẫu:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "fullName": "Test User",
  "phone": "+84901234567",
  "address": "123 Test Street"
}
```

### 2. Test Protected Endpoints
Sau khi có token, bạn có thể test các protected endpoints:
- **Get Profile**
- **Update Profile**
- **Change Password**

Token sẽ tự động được sử dụng từ environment variable.

### 3. Login as Admin (Để test Admin endpoints)
1. Vào **Public Endpoints** → **Login User**
2. Sử dụng email/password của admin account
3. Token sẽ được cập nhật tự động

**Body mẫu:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

### 4. Test Admin Endpoints
Sau khi login với admin account, bạn có thể test:
- **Get All Users** (với các query parameters)
- **Get User by ID**
- **Update User**
- **Delete User**
- **Get User Statistics**
- **Create Admin User**

## 🔧 Manual Testing (Nếu không dùng Collection)

### 1. Register
```
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "fullName": "Test User"
}
```

### 2. Copy Token
Từ response, copy giá trị `token`

### 3. Set Authorization Header
Trong Postman:
- Tab **Authorization**
- Type: **Bearer Token**
- Token: `<paste_token_here>`

### 4. Test Protected Endpoints
Sử dụng token trong Authorization header cho tất cả protected endpoints.

## 📋 Query Parameters Examples

### Get All Users với Filters
```
GET http://localhost:3000/api/users?page=1&limit=20&role=admin&isActive=true&sort=createdAt&order=desc
```

### Search Users
```
GET http://localhost:3000/api/users?search=john@example.com
```

### Filter by Date Range
```
GET http://localhost:3000/api/users?createdFrom=2024-01-01T00:00:00.000Z&createdTo=2024-12-31T23:59:59.999Z
```

## ✅ Validation Rules

### Username
- Required
- 3-50 characters
- Only letters, numbers, underscores

### Email
- Required
- Valid email format

### Password
- Required
- Minimum 6 characters
- Must contain: uppercase, lowercase, and number

### Phone
- Optional
- Valid international phone format

### Full Name
- Optional
- 2-100 characters

### Address
- Optional
- 5-200 characters

## 🐛 Common Issues

### 401 Unauthorized
- Kiểm tra token có đúng không
- Token có thể đã hết hạn (mặc định 7 days)
- Login lại để lấy token mới

### 403 Forbidden
- Endpoint yêu cầu admin role
- Đảm bảo bạn đang login với admin account

### 400 Bad Request
- Kiểm tra validation rules
- Xem response để biết field nào bị lỗi

### 404 Not Found
- Kiểm tra URL có đúng không
- Kiểm tra user ID có tồn tại không

## 💡 Tips

1. **Auto-save Token**: Collection đã được cấu hình để tự động lưu token sau khi login/register
2. **Environment Variables**: Sử dụng `{{base_url}}` và `{{token}}` trong requests
3. **Test Scripts**: Collection có test scripts để tự động lưu token
4. **Query Params**: Sử dụng tab Params trong Postman để dễ dàng thêm query parameters

## 📚 Full Documentation

Xem file `API-DOCUMENTATION-POSTMAN.md` để biết chi tiết về tất cả endpoints, request/response examples, và error handling.

---

**Happy Testing! 🎉**

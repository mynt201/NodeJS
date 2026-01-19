# 📚 API Documentation - User Controller
## Postman Testing Guide

**Base URL:** `http://localhost:3000/api/users`

**Authentication:** Bearer Token (JWT)
- Format: `Authorization: Bearer <token>`
- Token được trả về từ `/api/users/login` hoặc `/api/users/register`

---

## 🔓 Public Endpoints (Không cần authentication)

### 1. Register User
**POST** `/api/users/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "fullName": "John Doe",
  "phone": "+84901234567",
  "address": "123 Main Street, Ho Chi Minh City"
}
```

**Validation Rules:**
- `username`: Required, 3-50 characters, only letters, numbers, underscores
- `email`: Required, valid email format
- `password`: Required, min 6 characters, must contain uppercase, lowercase, and number
- `fullName`: Optional, 2-100 characters
- `phone`: Optional, valid phone format
- `address`: Optional, 5-200 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "address": "123 Main Street, Ho Chi Minh City",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z"
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
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

---

### 2. Login User
**POST** `/api/users/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "address": "123 Main Street, Ho Chi Minh City",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "displayName": "John Doe"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

## 🔒 Protected Endpoints (Cần authentication)

### 3. Get Current User Profile
**GET** `/api/users/profile`

**Headers:**
```
Authorization: Bearer <your_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "address": "123 Main Street, Ho Chi Minh City",
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "displayName": "John Doe",
    "isActive": true
  }
}
```

---

### 4. Update User Profile
**PUT** `/api/users/profile`

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body (JSON):** - Tất cả fields đều optional
```json
{
  "fullName": "John Updated Doe",
  "phone": "+84987654321",
  "address": "456 New Street, Hanoi",
  "email": "newemail@example.com"
}
```

**Validation Rules:**
- `fullName`: Optional, 2-100 characters
- `phone`: Optional, valid phone format
- `address`: Optional, 5-200 characters
- `email`: Optional, valid email format (must be unique if changed)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "newemail@example.com",
    "role": "user",
    "fullName": "John Updated Doe",
    "phone": "+84987654321",
    "address": "456 New Street, Hanoi",
    "displayName": "John Updated Doe"
  }
}
```

---

### 5. Change Password
**PUT** `/api/users/change-password`

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456"
}
```

**Validation Rules:**
- `currentPassword`: Required
- `newPassword`: Required, min 6 characters, must contain uppercase, lowercase, and number

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

## 👑 Admin Only Endpoints

### 6. Get All Users (Admin)
**GET** `/api/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term (searches in username, email, fullName, phone, address)
- `role` (optional): Filter by role - `admin`, `user`, `all`, or comma-separated `admin,user`
- `isActive` (optional): Filter by status - `true`, `false`, or `all`
- `createdFrom` (optional): ISO8601 date - Filter users created from this date
- `createdTo` (optional): ISO8601 date - Filter users created until this date
- `lastLoginFrom` (optional): ISO8601 date - Filter users last login from this date
- `lastLoginTo` (optional): ISO8601 date - Filter users last login until this date
- `sort` (optional): Sort field - `createdAt`, `lastLogin`, `username`, `email`, `name` (default: `createdAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Example URLs:**
```
GET /api/users
GET /api/users?page=1&limit=20
GET /api/users?search=john
GET /api/users?role=admin&isActive=true
GET /api/users?role=admin,user&page=2&limit=50
GET /api/users?createdFrom=2024-01-01T00:00:00.000Z&createdTo=2024-12-31T23:59:59.999Z
GET /api/users?search=john@example.com&sort=lastLogin&order=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "fullName": "John Doe",
      "phone": "+84901234567",
      "address": "123 Main Street",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "displayName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "filters": {
    "search": null,
    "role": null,
    "isActive": null,
    "createdFrom": null,
    "createdTo": null,
    "lastLoginFrom": null,
    "lastLoginTo": null
  },
  "sort": {
    "by": "createdAt",
    "order": "desc"
  }
}
```

---

### 7. Get User by ID (Admin)
**GET** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**URL Parameters:**
- `id`: MongoDB ObjectId của user

**Example:**
```
GET /api/users/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "address": "123 Main Street",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 8. Update User (Admin)
**PUT** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: MongoDB ObjectId của user

**Body (JSON):** - Tất cả fields đều optional
```json
{
  "role": "admin",
  "isActive": true,
  "fullName": "John Updated Doe",
  "phone": "+84987654321",
  "address": "456 New Street, Hanoi"
}
```

**Validation Rules:**
- `role`: Optional, must be `admin` or `user`
- `isActive`: Optional, must be boolean
- `fullName`: Optional, 2-100 characters
- `phone`: Optional, valid phone format
- `address`: Optional, 5-200 characters

**Example:**
```
PUT /api/users/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "fullName": "John Updated Doe",
    "phone": "+84987654321",
    "address": "456 New Street, Hanoi",
    "isActive": true
  }
}
```

---

### 9. Delete User (Admin)
**DELETE** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**URL Parameters:**
- `id`: MongoDB ObjectId của user

**Example:**
```
DELETE /api/users/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Cannot delete your own account"
}
```

---

### 10. Get User Statistics (Admin)
**GET** `/api/users/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 100,
    "activeUsers": 85,
    "adminUsers": 5,
    "recentUsers": 20
  }
}
```

---

### 11. Create Admin User (Admin)
**POST** `/api/users/create-admin`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "admin_user",
  "email": "admin@example.com",
  "password": "AdminPass123",
  "fullName": "Admin User",
  "phone": "+84901234567",
  "address": "123 Admin Street"
}
```

**Validation Rules:**
- `username`: Required, 3-50 characters, only letters, numbers, underscores
- `email`: Required, valid email format
- `password`: Required, min 6 characters, must contain uppercase, lowercase, and number
- `fullName`: Optional, 2-100 characters
- `phone`: Optional, valid phone format
- `address`: Optional, 5-200 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin",
    "fullName": "Admin User",
    "phone": "+84901234567",
    "address": "123 Admin Street",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": null
  }
}
```

---

## 🔐 Authentication Header Format

Tất cả các protected endpoints đều cần header:
```
Authorization: Bearer <token>
```

**Lấy token:**
1. Đăng ký: `POST /api/users/register` → nhận token trong response
2. Đăng nhập: `POST /api/users/login` → nhận token trong response

**Copy token và paste vào Postman:**
- Vào tab **Authorization**
- Chọn type: **Bearer Token**
- Paste token vào field **Token**

---

## 📝 Common Error Responses

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
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Email already registered"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server error during registration"
}
```

---

## 🧪 Testing Workflow trong Postman

### Step 1: Register User
```
POST http://localhost:3000/api/users/register
Body: {
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "fullName": "Test User"
}
```
→ Copy `token` từ response

### Step 2: Set Environment Variable
Trong Postman:
- Tạo Environment: `Flood Risk API`
- Thêm variable: `token` = `<paste_token_here>`
- Thêm variable: `base_url` = `http://localhost:3000/api/users`

### Step 3: Test Protected Endpoints
- Sử dụng `{{token}}` trong Authorization header
- Sử dụng `{{base_url}}` trong URL

### Step 4: Login as Admin (nếu cần)
```
POST http://localhost:3000/api/users/login
Body: {
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```
→ Update `token` variable với admin token

---

## 📋 Postman Collection JSON

Bạn có thể import file này vào Postman:

```json
{
  "info": {
    "name": "Flood Risk - User API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/users",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Public",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123456\",\n  \"fullName\": \"Test User\",\n  \"phone\": \"+84901234567\",\n  \"address\": \"123 Test Street\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/register",
              "host": ["{{base_url}}"],
              "path": ["register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123456\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/login",
              "host": ["{{base_url}}"],
              "path": ["login"]
            }
          }
        }
      ]
    },
    {
      "name": "Protected",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/profile",
              "host": ["{{base_url}}"],
              "path": ["profile"]
            }
          }
        },
        {
          "name": "Update Profile",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fullName\": \"Updated Name\",\n  \"phone\": \"+84987654321\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/profile",
              "host": ["{{base_url}}"],
              "path": ["profile"]
            }
          }
        },
        {
          "name": "Change Password",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"currentPassword\": \"Test123456\",\n  \"newPassword\": \"NewPass123456\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/change-password",
              "host": ["{{base_url}}"],
              "path": ["change-password"]
            }
          }
        }
      ]
    },
    {
      "name": "Admin Only",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}?page=1&limit=10&search=&role=all&isActive=all",
              "host": ["{{base_url}}"],
              "path": [""],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                },
                {
                  "key": "search",
                  "value": ""
                },
                {
                  "key": "role",
                  "value": "all"
                },
                {
                  "key": "isActive",
                  "value": "all"
                }
              ]
            }
          }
        },
        {
          "name": "Get User by ID",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/:id",
              "host": ["{{base_url}}"],
              "path": [":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "507f1f77bcf86cd799439011"
                }
              ]
            }
          }
        },
        {
          "name": "Update User",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"role\": \"admin\",\n  \"isActive\": true\n}"
            },
            "url": {
              "raw": "{{base_url}}/:id",
              "host": ["{{base_url}}"],
              "path": [":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "507f1f77bcf86cd799439011"
                }
              ]
            }
          }
        },
        {
          "name": "Delete User",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/:id",
              "host": ["{{base_url}}"],
              "path": [":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "507f1f77bcf86cd799439011"
                }
              ]
            }
          }
        },
        {
          "name": "Get User Stats",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/stats",
              "host": ["{{base_url}}"],
              "path": ["stats"]
            }
          }
        },
        {
          "name": "Create Admin User",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"newadmin\",\n  \"email\": \"newadmin@example.com\",\n  \"password\": \"Admin123456\",\n  \"fullName\": \"New Admin\",\n  \"phone\": \"+84901234567\",\n  \"address\": \"123 Admin Street\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/create-admin",
              "host": ["{{base_url}}"],
              "path": ["create-admin"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 💡 Tips

1. **Lưu token tự động:** Sử dụng Postman Tests để lưu token:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set("token", jsonData.token);
    }
}
```

2. **Test validation:** Thử gửi invalid data để test validation rules

3. **Test error cases:** 
   - Gửi request không có token
   - Gửi request với invalid token
   - Gửi request với user role vào admin endpoints

4. **Query parameters:** Sử dụng Params tab trong Postman để dễ dàng thêm query parameters

---

**Happy Testing! 🚀**

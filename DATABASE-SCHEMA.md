# Thiết kế Database

## Tổng quan

Schema sử dụng **MongoDB + Mongoose**. Trường `geom` lưu GeoJSON (tương đương GEOMETRY(Polygon, 4326) trong PostGIS).

---

## Bảng 0: `users` (Định danh & Phân quyền)

| Trường        | Kiểu        | Ràng buộc      | Ghi chú                             |
|---------------|-------------|----------------|-------------------------------------|
| `_id`         | ObjectId (PK) |                | Tự động tăng                        |
| `username`    | String(50)  | Unique, Not Null | Tên đăng nhập (vd: admin_thu_duc) |
| `password_hash` | String     | Not Null       | bcrypt/argon2                       |
| `full_name`   | String(100) | Not Null       | Họ tên hiển thị                     |
| `email`       | String(100) | Unique, Not Null | Khôi phục mật khẩu/thông báo     |
| `role`        | String(20)  | Not Null       | SUPER_ADMIN, WARD_ADMIN             |
| `ward_id`     | ObjectId (FK) |                | → administrative_units (NULL nếu SUPER_ADMIN) |
| `created_at`  | Date        | Default Now()  | Timestamps                          |
| `is_active`   | Boolean     | Default True   | Cho phép/Khóa tài khoản             |

---

## Bảng 1: `administrative_units` (Đơn vị hành chính)

Lưu ranh giới các phường tại Thủ Đức (Quận 2, Quận 9).

| Trường     | Kiểu                    | Mô tả                          |
|------------|-------------------------|--------------------------------|
| `_id`      | ObjectId (PK)           | Primary Key                    |
| `name`     | String                  | Tên phường                     |
| `geom`     | GeoJSON                 | Ranh giới (Polygon/MultiPolygon, WGS84) |
| `area_km2` | Number                  | Diện tích (km²)                |
| `createdAt`| Date                    | Timestamp                      |
| `updatedAt`| Date                    | Timestamp                      |

**Index:** `geom` (2dsphere), `name`

---

## Bảng 2: `flood_indicators` (Danh mục yếu tố)

10 yếu tố và trọng số AHP.

| Trường     | Kiểu   | Mô tả                                         |
|------------|--------|-----------------------------------------------|
| `_id`      | ObjectId (PK) | Primary Key                           |
| `code`     | String | Mã yếu tố (ELEVATION, SUBSIDENCE, POPDENSITY...) |
| `name`     | String | Tên yếu tố                                    |
| `group_type` | String | Hazard / Exposure / Susceptibility / Resilience |
| `weight`   | Number | Trọng số w_i ∈ [0, 1]                         |

---

## Bảng 3: `indicator_values` (Giá trị theo thời gian)

Giá trị các yếu tố theo đơn vị hành chính và năm.

| Trường           | Kiểu        | Mô tả                              |
|------------------|-------------|------------------------------------|
| `_id`            | ObjectId (PK) | Primary Key                     |
| `unit_id`        | ObjectId (FK) | → administrative_units          |
| `indicator_id`   | ObjectId (FK) | → flood_indicators              |
| `year`           | Number      | Năm (2015, 2020, 2025...)         |
| `raw_value`      | Number      | Giá trị thô                       |
| `normalized_value` | Number    | Giá trị chuẩn hóa [0, 1]         |
| `updated_by`     | ObjectId (FK) | → users (Nullable). Ai nhập/điều chỉnh (cán bộ phường hay cấp thành phố) |

**Unique:** (unit_id, indicator_id, data_year)

---

## Bảng 4: `risk_assessment` (Kết quả đánh giá)

Kết quả tổng hợp để hiển thị trên bản đồ.

| Trường     | Kiểu        | Mô tả                                    |
|------------|-------------|------------------------------------------|
| `_id`      | ObjectId (PK) | Primary Key                           |
| `unit_id`  | ObjectId (FK) | → administrative_units                |
| `year`     | Number      | Năm đánh giá                            |
| `total_score` | Number   | Điểm rủi ro RI                          |
| `risk_level` | String    | Rất thấp / Thấp / Trung bình / Cao / Rất cao |

**Unique:** (unit_id, year)

---

## Scripts

```bash
# Seed flood_indicators (10 yếu tố AHP)
npm run seed-new

# Import 24 phường từ GADM vào administrative_units
npm run import-units
# Hoặc: node utils/import-administrative-units-from-gadm.js /path/to/gadm41_VNM_3.json
```

---

## API Routes

| Base Path | Mô tả |
|-----------|-------|
| `/api/users` | Đăng nhập, đăng ký, quản lý user |
| `/api/administrative-units` | CRUD đơn vị hành chính (phường) |
| `/api/flood-indicators` | CRUD danh mục yếu tố |
| `/api/indicator-values` | CRUD giá trị yếu tố theo năm |
| `/api/risk-assessments` | CRUD kết quả đánh giá rủi ro |
| `/api/settings` | Cài đặt người dùng |

---

## Lưu ý

- File GADM: đặt `gadm41_VNM_3.json` trong `flood-risk/utils/` hoặc truyền đường dẫn khi chạy script.

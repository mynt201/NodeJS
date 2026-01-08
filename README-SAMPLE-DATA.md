# Sample Data Import Guide

Tài liệu hướng dẫn import dữ liệu mẫu cho hệ thống Flood Risk Management.

## 📋 Tổng quan

File `sample-data.json` chứa dữ liệu mẫu cho tất cả các collections trong hệ thống flood risk management, bao gồm:

- **Users**: 4 tài khoản người dùng với vai trò khác nhau
- **Wards**: 5 phường/xã ở TP.HCM với thông tin địa lý và tham số rủi ro
- **Weather Data**: Dữ liệu thời tiết cho các phường
- **Drainage Data**: Thông tin hệ thống thoát nước
- **Road/Bridge Data**: Dữ liệu về đường sá và cầu
- **Risk Index Data**: Chỉ số rủi ro lũ lụt

## 🚀 Cách sử dụng

### 1. Import dữ liệu mẫu

Chạy lệnh sau để import toàn bộ dữ liệu mẫu:

```bash
node import-sample-data.js
```

### 2. Hoặc import từng collection

Nếu bạn chỉ muốn import một số collections cụ thể, bạn có thể chỉnh sửa file `import-sample-data.js` để comment out các phần không cần thiết.

### 3. Kiểm tra dữ liệu đã import

Sau khi import thành công, bạn có thể kiểm tra bằng cách:

```bash
# Kết nối vào MongoDB
mongosh mongodb://localhost:27017/dbconect

# Xem danh sách collections
show collections

# Đếm số lượng documents trong mỗi collection
db.users.count()
db.wards.count()
db.weatherdatas.count()
db.drainagedatas.count()
db.roadbridgedatas.count()
db.riskindexdatas.count()
```

## 🔑 Tài khoản đăng nhập mẫu

Sau khi import, bạn có thể đăng nhập bằng các tài khoản sau:

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@floodrisk.com | admin123 | Admin |
| manager@floodrisk.com | admin123 | User (Manager) |
| officer@floodrisk.com | admin123 | User (District Officer) |
| researcher@university.edu.vn | admin123 | User (Researcher) |

## 📊 Dữ liệu mẫu chi tiết

### Wards (Phường/Xã)

1. **Ben Nghe** - District 1: Rủi ro trung bình, mật độ dân số cao
2. **Da Kao** - District 1: Rủi ro thấp, hệ thống thoát nước tốt
3. **Nguyen Thai Binh** - District 1: Rủi ro rất cao, thường xuyên ngập
4. **Tan Dinh** - District 1: Rủi ro cao, mật độ dân số rất cao
5. **Phu Nhuan** - Phu Nhuan: Rủi ro rất cao, khu vực đô thị hóa mạnh

### Risk Categories

- **Very Low (0-2)**: Rủi ro rất thấp
- **Low (2-4)**: Rủi ro thấp
- **Medium (4-6)**: Rủi ro trung bình
- **High (6-8)**: Rủi ro cao
- **Very High (8-10)**: Rủi ro rất cao

## 🛠️ Sửa đổi dữ liệu

### Thêm dữ liệu mới

1. Mở file `sample-data.json`
2. Thêm dữ liệu vào các array tương ứng
3. Chạy lại script import (lưu ý: dữ liệu cũ sẽ không bị ghi đè nếu có duplicate key)

### Xóa toàn bộ dữ liệu

Nếu muốn xóa toàn bộ dữ liệu và import lại từ đầu:

```bash
# Trong MongoDB shell
db.users.drop()
db.wards.drop()
db.weatherdatas.drop()
db.drainagedatas.drop()
db.roadbridgedatas.drop()
db.riskindexdatas.drop()
```

Sau đó chạy lại `node import-sample-data.js`.

## ⚠️ Lưu ý quan trọng

1. **Password hashing**: Các mật khẩu trong dữ liệu mẫu đã được hash. Trong môi trường production, hãy sử dụng password mạnh và hash chúng đúng cách.

2. **ObjectId references**: Dữ liệu mẫu sử dụng ObjectId giả định để liên kết giữa các collections. Trong thực tế, hãy sử dụng ObjectId thực từ database.

3. **Geospatial data**: Dữ liệu địa lý sử dụng tọa độ mẫu. Hãy thay thế bằng dữ liệu thực tế của khu vực bạn quản lý.

4. **Date formats**: Tất cả dates đều sử dụng ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).

5. **Data validation**: Dữ liệu mẫu đã được thiết kế để pass qua tất cả validation rules của models.

## 📞 Hỗ trợ

Nếu gặp vấn đề khi import dữ liệu:

1. Kiểm tra MongoDB đã chạy chưa
2. Kiểm tra file `.env` có cấu hình đúng DATABASE_URL không
3. Xem log lỗi chi tiết khi chạy script
4. Đảm bảo các dependencies đã được install (`npm install`)

## 🎯 Mục đích sử dụng

Dữ liệu mẫu này được tạo ra để:

- **Testing**: Test các tính năng của hệ thống
- **Development**: Phát triển và debug
- **Demo**: Trình diễn hệ thống cho stakeholders
- **Training**: Đào tạo người dùng mới

Đừng sử dụng dữ liệu mẫu này trong môi trường production!

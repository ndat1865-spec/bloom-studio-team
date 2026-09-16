# Nguyễn Tiến Đạt — Auth + API Gateway

Đây là **bộ khởi đầu giai đoạn 1** được chuẩn bị chung cho nhóm, có thể chạy và commit ngay.
Người phụ trách đọc, chạy thử và tiếp tục phát triển phần này.

## Chuẩn bị

Cài **JDK 17**, đặt JAVA_HOME trỏ vào thư mục JDK 17. Không cần cài Maven vì đã có Maven Wrapper.
Lần chạy đầu cần Internet để tải thư viện. Không cần MySQL/Docker.
Không copy `node_modules`, `target`, file môi trường hay code của bản hoàn chỉnh vào gói này.

## Chạy

Mở **Command Prompt hoặc terminal PowerShell** tại thư mục gốc repo `bloom-studio-team`.
Với PowerShell, bỏ qua dòng bắt đầu bằng `REM` (đó chỉ là chú thích cho Command Prompt).

```bat
cd auth-service
.\mvnw.cmd spring-boot:run

REM Mo terminal thu hai tai thu muc repo:
cd api-gateway
.\mvnw.cmd spring-boot:run
```

- Auth: http://localhost:18081/health
- Gateway: http://localhost:18080/health
- Đăng nhập qua Gateway: `POST http://localhost:18080/api/auth/login`
- Body JSON: `{"username":"demo","password":"bloom123"}`

Dừng bằng Ctrl+C. Nếu cổng đã bận, dừng đúng tiến trình đang dùng cổng đó hoặc bản starter đã mở trước.
Có thể đổi cổng bằng biến `PORT`; khi ghép nhóm cần sửa URI tương ứng ở Gateway.

## Đã có

- Đăng ký tài khoản trong bộ nhớ, kiểm tra trùng username.
- BCrypt cho mật khẩu, JWT có hạn 1 giờ; `/auth/me` kiểm tra chữ ký và hạn token.
- Gateway định tuyến đến 3 service; CORS cho 2 ứng dụng frontend.
- Gateway và Auth đều khởi động riêng được.

## Giới hạn hiện tại

Khóa JWT sinh ngẫu nhiên khi chạy Auth, chỉ nằm trong RAM. Khởi động lại làm mất tài khoản mới và vô hiệu hóa token cũ. Chưa chia khóa cho các service khác vì các API sản phẩm/tính giá của bản đầu là công khai. Tài khoản demo chỉ có quyền CUSTOMER.

## Việc làm tiếp

- Thêm MySQL/JPA cho tài khoản.
- Thống nhất khóa JWT và xác thực tại từng service có API được bảo vệ.
- Phân quyền CUSTOMER/ADMIN, quản lý API Key.
- Tích hợp các phần, Docker, kiểm thử đầu-cuối.

## Đóng góp

Phụ trách: **Nguyễn Tiến Đạt**. Code hiện nằm ở `auth-service/` và `api-gateway/` tại gốc repo; thư mục `01-nguyen-tien-dat/` chỉ còn tài liệu và file cấu hình bỏ qua Git cũ.

Từ gốc repo, tạo nhánh `feat/auth-<ten-chuc-nang>` hoặc `feat/gateway-<ten-chuc-nang>`, sửa đúng service, chạy thử rồi commit và tạo pull request vào `main`.

[Quay lại README chung](../README.md).
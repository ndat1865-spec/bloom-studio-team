# Hoàng Tuấn Anh — Product Service

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
cd product-service
.\mvnw.cmd spring-boot:run
```

- http://localhost:18082/health
- http://localhost:18082/products
- http://localhost:18082/products/1
- http://localhost:18082/products?name=hong
- http://localhost:18082/categories

Dừng bằng Ctrl+C. Nếu cổng đã bận, dừng đúng tiến trình đang dùng cổng đó hoặc bản starter đã mở trước.
Có thể đổi cổng bằng biến `PORT`; khi ghép nhóm cần sửa URI tương ứng ở Gateway.

## Đã có

- 3 sản phẩm và 3 danh mục mẫu.
- API danh sách, tìm theo tên và chi tiết.
- Giá dùng BigDecimal; có tồn kho mẫu.
- Sản phẩm không tồn tại trả 404.

## Giới hạn hiện tại

Bản đầu chỉ đọc dữ liệu trong bộ nhớ. Chưa có thêm/sửa/xóa, upload ảnh, giữ hoặc hoàn tồn kho. Chạy độc lập không cần Auth, Order hay database.

## Việc làm tiếp

- Entity/Repository và MySQL.
- CRUD sản phẩm/danh mục, upload ảnh, phân trang.
- API giữ/hoàn tồn kho để Bình Minh gọi.
- Bảo vệ thao tác ghi bằng JWT/ADMIN, phối hợp với Đạt.

## Đóng góp

Phụ trách: **Hoàng Tuấn Anh**. Từ thư mục gốc repo, tạo nhánh `feat/product-<ten-chuc-nang>`, sửa phần `product-service/`, chạy thử rồi commit và tạo pull request vào `main`.

Hướng dẫn riêng của Product Service nằm trong file này. README ở gốc repo là giới thiệu chung của nhóm.

[Quay lại README chung](../README.md).
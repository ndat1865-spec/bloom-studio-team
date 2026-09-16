# Ranh giới của bộ khởi đầu

- **Auth — Đạt:** sở hữu tài khoản trong RAM, mật khẩu BCrypt, sinh và kiểm tra JWT.
- **Gateway — Đạt:** chỉ định tuyến và CORS; chưa xác thực JWT thay các service.
- **Product — Tuấn Anh:** sở hữu danh mục, sản phẩm, giá và tồn kho mẫu.
- **Order — Bình Minh:** tính giá dự kiến bằng cách gọi REST tới Product. Không đọc trực tiếp dữ liệu của Product.
- **Customer frontend — Mỹ Ngân:** giao diện chọn hoa, tính giá.
- **Admin frontend — Minh Thu:** khung bảng quản trị và form thử kết nối tài khoản.

Hai frontend trong chế độ API chỉ gọi Gateway. Order gọi Product qua HTTP.
Chế độ Demo của frontend là dữ liệu giả rõ ràng, tách khỏi chế độ API.
Hai frontend là hai ứng dụng riêng với cổng cố định, không phải Vite tự nhảy cổng.

Bộ này chưa dùng database, chưa tạo đơn thực tế, chưa có giao dịch phân tán.
Giai đoạn tiếp theo: mỗi service nghiệp vụ có DB riêng, bổ sung xác thực/phân quyền
ở từng service, API giữ/hoàn tồn kho và bù trừ khi đặt hàng lỗi.
Không ghép thẳng DTO starter vào bản hoàn chỉnh: danh sách Product hiện là mảng,
còn bản hoàn chỉnh có phân trang; hai giai đoạn có hợp đồng riêng.

# Kết quả kiểm tra bộ khởi đầu — 16/09/2026

## Build

- 4 ứng dụng Java (Auth, Gateway, Product, Order): `mvnw.cmd -B -q package` thành công với JDK 17.
- 2 frontend: cài thư viện và `npm run build` thành công (TypeScript + Vite).
- Maven Wrapper và package-lock.json có trong gói tương ứng.
- Không cần MySQL; không kết nối CSDL của bản hoàn chỉnh.

## HTTP thật: 32/32 đạt

Đã khởi động cả 4 ứng dụng, chạy `node scripts/smoke-test.mjs`:

- Health cho đủ 4 ứng dụng.
- Đăng nhập, JWT /me, từ chối token giả/thiếu, mật khẩu sai.
- Đăng ký tài khoản mới, trùng username, validation; role client gửi không được tin.
- Danh sách, chi tiết, tìm sản phẩm qua Gateway; danh mục; 404.
- Đơn mẫu qua Gateway và trực tiếp.
- Tính giá Order → Product, lấy giá từ Product thay vì giá client gửi.
- Preview không đổi tồn kho; vượt kho 409; dữ liệu sai 400; sản phẩm thiếu 404.
- Preflight CORS cho 4 origin được hỗ trợ; origin lạ bị chặn.
- Không route API nội bộ ra Gateway.

## Chạy độc lập khi Product không có

Một instance Order riêng ở :18084 được chạy với Product URL trỏ cổng không có server:
health vẫn UP, đơn mẫu vẫn đọc được, preview trả 503 rõ ràng. Instance này đã dừng sau kiểm tra.

## Trình duyệt thật

Đã mở cả hai frontend trong trình duyệt và thực hiện:

- Cửa hàng mặc định có 3 sản phẩm demo.
- Nhập số lượng 2, Tính giá trong Demo → 700.000 đ.
- Chuyển sang API, tải 3 sản phẩm qua Gateway.
- Tính giá qua API → 700.000 đ, ghi chú chưa tạo đơn/chưa trừ tồn kho.
- Quản trị mở được các chỉ số 3 sản phẩm, tồn kho 40, 1 đơn mẫu.
- Chuyển quản trị sang API, dữ liệu tải thành công.
- Tab Kết nối tài khoản: đăng nhập demo, gọi /me bằng JWT, hiển thị CUSTOMER.
- Kiểm tra bố cục cửa hàng bằng ảnh chụp trình duyệt.

## Phạm vi

Đây là kiểm thử của **bộ khởi đầu**, không khẳng định các chức năng chưa viết đã hoàn thành.
Chưa có CRUD quản trị, đơn hàng thật, database, giữ tồn kho hay phân quyền quản trị.
Dữ liệu demo và dữ liệu RAM có giới hạn được ghi trong README từng người.

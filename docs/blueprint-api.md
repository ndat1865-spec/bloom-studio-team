# API của bộ khởi đầu

Đây là hợp đồng của **team-starter**, độc lập với API đầy đủ trong repo cha.
Danh sách Product trả mảng trực tiếp, chưa dùng đối tượng phân trang như bản hoàn chỉnh.
Gateway: `http://localhost:18080`. Chỉ Gateway khai báo CORS.

| Qua Gateway | Service trực tiếp | Ý nghĩa |
|---|---|---|
| POST /api/auth/register | :18081/auth/register | JSON username/password → 201 profile; trùng → 409 |
| POST /api/auth/login | :18081/auth/login | JSON username/password → token và user; sai → 401 |
| GET /api/auth/me | :18081/auth/me | Bearer JWT hợp lệ → profile; thiếu/sai → 401 |
| GET /api/products?name=hong | :18082/products?name=hong | Mảng sản phẩm, lọc tên không phân biệt hoa/thường |
| GET /api/products/{id} | :18082/products/{id} | Chi tiết; thiếu → 404 |
| GET /api/categories | :18082/categories | Mảng danh mục |
| GET /api/orders/demo | :18083/orders/demo | Đơn mẫu cố định, công khai, không có dữ liệu người dùng |
| POST /api/orders/preview | :18083/orders/preview | JSON productId/quantity → giá từ Product, tổng và ghi chú |
| GET /health | :18080/health | Trạng thái Gateway; mỗi service có /health riêng |

Username: 3–30 ký tự chữ/số/gạch dưới. Password demo: 6–64 ký tự ASCII.
Profile: `{id, username, role}`. Login: `{token, user}`.
Product: `{id, name, price, categoryId, stockQuantity}`.
Category: `{id, name}`.
Demo order: `{id, productName, quantity, total, status:"DEMO"}`.
Preview: `{productId, productName, quantity, unitPrice, total, note}`.

Preview nhận `{"productId":1,"quantity":2}`, bỏ qua giá do client tự gửi;
quantity 1–99; vượt tồn kho → 409; sản phẩm không tồn tại → 404;
Product không chạy → 503. Không ghi đơn, không trừ hay giữ tồn kho.

Lỗi nghiệp vụ: `{"message":"..."}`. Lỗi validation: `{"tenField":"..."}`.
Các endpoint ngoài /auth/me là public trong mốc này; không có API ghi dữ liệu quản trị.
Token/role chỉ do Auth cấp, không nhận userId/role để quyết định quyền từ client.

Nguồn frontend được cho phép: localhost và 127.0.0.1, cổng 15173 (khách) / 15174 (quản trị).

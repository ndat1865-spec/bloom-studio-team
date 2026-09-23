# order-service — Đặt hàng và đơn hàng

Phụ trách: **Lê Ngọc Bình Minh** · Cổng **8083** · CSDL `bloom_order`

Nhận đơn đặt hàng, gọi sang `product-service` để trừ tồn kho, lưu đơn và trạng thái đơn.
Cung cấp số liệu doanh thu cho trang Tổng quan của quản trị.

## Chạy

```bat
cd order-service
.\mvnw.cmd spring-boot:run
```

Cần MySQL, CSDL `bloom_order`, biến `DB_PASSWORD`, và `product-service` đang chạy thì mới
đặt hàng được (xem đơn cũ thì không cần).

## Endpoint (qua Gateway thêm tiền tố `/api`)

| Method | Đường dẫn | Quyền |
|---|---|---|
| POST | `/orders` | Đã đăng nhập |
| GET | `/orders/my` | Đã đăng nhập — đơn của chính mình |
| GET | `/orders/{id}` | Chủ đơn hoặc ADMIN |
| GET | `/orders` | ADMIN |
| GET | `/orders/overview?from=&to=` | ADMIN |
| PUT | `/orders/{id}/status` | ADMIN |

Danh sách đầy đủ: [docs/blueprint-api.md](../docs/blueprint-api.md).

## Luồng đặt hàng

1. Lấy `userId` từ JWT — **không** nhận `userId` từ body.
2. Với từng dòng: gọi `PATCH /internal/products/{id}/reserve-stock` sang `product-service`.
3. Một dòng lỗi giữa chừng (hết hàng → 409) thì gọi `release-stock` hoàn lại các dòng đã trừ.
4. Lưu đơn kèm `productName`, `unitPrice`, `imageUrl` tại thời điểm đặt (không đọc CSDL
   của `product-service`).

## File đáng đọc

- `client/ProductClient.java` — gọi sang `product-service` (địa chỉ từ `PRODUCT_SERVICE_URL`)
- `config/RestTemplateConfig.java` — phải dùng `JdkClientHttpRequestFactory`; mặc định
  `RestTemplate` không gửi được PATCH
- `service/OrderService.java` — đặt hàng và bù trừ
- `service/OrderOverviewService.java` — doanh thu, biểu đồ theo ngày, top bán chạy

Muốn test hết hàng thì đặt `quantity: 99` (tồn kho mặc định 50). Số lớn hơn 99 bị chặn
`400` ở validation trước khi tới bước kiểm tra tồn kho.

[Quay lại README chung](../README.md)

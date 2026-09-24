# product-service — Hoa, danh mục, tồn kho

Phụ trách: **Hoàng Tuấn Anh** · Cổng **8082** · CSDL `bloom_product`

Quản lý sản phẩm (hoa) và danh mục: tìm kiếm, phân trang, thêm/sửa/xoá, tải ảnh. Giữ số
lượng tồn kho và cung cấp API nội bộ để `order-service` trừ / hoàn tồn kho khi đặt hàng.

## Chạy

```bat
cd product-service
.\mvnw.cmd spring-boot:run
```

Cần MySQL, CSDL `bloom_product` và biến `DB_PASSWORD`. Bảng `products` còn rỗng thì
`DataSeeder` tự nạp 3 danh mục và 20 sản phẩm từ `src/main/resources/seed/danh-muc-hoa.txt`.

Thử nhanh: http://localhost:8082/products · http://localhost:8082/categories

## Endpoint (qua Gateway thêm tiền tố `/api`)

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/products`, `/products/{id}`, `/categories`, `/categories/{id}/products` | Công khai |
| POST, PUT, DELETE | `/products/**`, `/categories/**` | ADMIN |
| POST | `/products/{id}/upload-image` | ADMIN |
| PATCH | `/internal/products/{id}/reserve-stock`, `/release-stock` | Chỉ `order-service` gọi |

Danh sách đầy đủ: [docs/blueprint-api.md](../docs/blueprint-api.md).

## Ảnh

- Ảnh mẫu: `src/main/resources/static/uploads/seed/` — nằm trong classpath, **có** commit.
- Ảnh admin tải lên lúc chạy: thư mục `uploads/` trên đĩa (`UPLOAD_DIR`) — **không** commit.
- `imageUrl` luôn là đường dẫn web `uploads/<tên file>`, không bao giờ là đường dẫn trên đĩa.
- `WebConfig` phải khai handler `/uploads/seed/**` **trước** handler `/uploads/**`, nếu
  không ảnh mẫu trả 404.

## Kiểm thử

```bat
.\mvnw.cmd test
```

`ProductWriteBindingTests` giữ lỗi từng làm hỏng toàn bộ trang quản lý hoa: một
`@RequestParam(required = false)` sót lại đứng trước `@RequestBody` khiến body luôn `null`.
`SeedImageTests`, `SeedCatalogueTests`, `FileStorageServiceTests` giữ phần ảnh và dữ liệu mẫu.

[Quay lại README chung](../README.md)

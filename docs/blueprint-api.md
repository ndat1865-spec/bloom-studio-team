# Blueprint API — Bloom Studio

> Toàn bộ endpoint của hệ thống sau khi tách service, đối chiếu với bản monolith cũ.
>
> Tiền tố `/api2025` của bản monolith được thay bằng `/api` do Gateway sở hữu; Gateway
> dùng `RewritePath` để dịch sang đường dẫn nội bộ của từng service.

## auth-service — cổng 8081, tiền tố qua Gateway: `/api/auth`

| Method | Endpoint nội bộ | Mô tả | Yêu cầu | Từ monolith |
|---|---|---|---|---|
| POST | `/auth/login` | Đăng nhập, trả JWT | Public | `POST /api2025/users/login` |
| POST | `/auth/register` | Đăng ký tài khoản CUSTOMER | Public | `POST /api2025/users/register` |
| GET | `/auth/me` | Thông tin tài khoản đang đăng nhập | JWT | *(mới)* |
| PUT | `/auth/me/profile` | Sửa hồ sơ của chính mình | JWT | `PUT /api2025/users/{id}/profile` |
| GET | `/users` | Danh sách tài khoản | ADMIN | `GET /api2025/users` |
| GET | `/users/{id}` | Chi tiết tài khoản | ADMIN | `GET /api2025/users/{id}` |
| PUT | `/users/{id}` | Sửa tài khoản | ADMIN | `PUT /api2025/users/{id}` |
| DELETE | `/users/{id}` | Xoá tài khoản | ADMIN | `DELETE /api2025/users/{id}` |
| GET | `/api-keys` | Danh sách API Key đã cấp — **không kèm khoá gốc** | ADMIN | *(mới)* |
| POST | `/api-keys` | Cấp API Key cho đối tác, trả khoá gốc **một lần duy nhất** | ADMIN | *(mới)* |
| POST | `/api-keys/{id}/revoke` | Thu hồi, giữ lại dòng để truy vết | ADMIN | *(mới)* |
| DELETE | `/api-keys/{id}` | Xoá hẳn khỏi CSDL, chỉ dùng dọn dữ liệu test | ADMIN | *(mới)* |

`PUT /auth/me/profile` thay cho `PUT /users/{id}/profile` của monolith: khách chỉ sửa được
hồ sơ **của chính mình**, id lấy từ token chứ không nhận từ URL. Bản cũ cho phép truyền id
bất kỳ — lỗi IDOR.

`POST /auth/login` trả **401** cùng `message: "Sai tên đăng nhập hoặc mật khẩu"`
cho cả mật khẩu sai và username không tồn tại. `GlobalExceptionHandler` xử lý
`InvalidCredentialsException` để lỗi này không trở thành 500.

### API nội bộ (không lộ qua Gateway)

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/internal/api-keys/validate` | Gateway hỏi: khoá này còn hiệu lực cho scope này không |

Dùng **POST với khoá trong body**, không phải `GET ?key=`: query string bị ghi vào access
log của mọi tầng đi qua, khoá sẽ nằm lại trong log dưới dạng rõ.

Body trả về `{valid, reason, ownerName, scopes}`. `reason` (`KHONG_TON_TAI`, `DA_THU_HOI`,
`HET_HAN`, `THIEU_SCOPE`) chỉ để Gateway ghi log và chọn mã trạng thái — **không** chuyển
nguyên văn ra ngoài cho đối tác, vì nói rõ "khoá đã bị thu hồi" là cho kẻ dò biết chuỗi
nào từng là khoá thật.

### Payload JWT

```json
{ "sub": "john", "userId": 2, "role": "CUSTOMER", "iat": ..., "exp": ... }
```

`userId` là bắt buộc — `order-service` cần nó để gán chủ đơn hàng mà không phải gọi
sang auth-service.

## product-service — cổng 8082, tiền tố: `/api/products`, `/api/categories`

| Method | Endpoint nội bộ | Mô tả | Yêu cầu | Từ monolith |
|---|---|---|---|---|
| GET | `/products` | Danh sách: `keyword` + `page` + `size` + `sort` | Public | giữ nguyên |
| GET | `/products/search` | Cùng handler với `/products` — bí danh giữ từ SOS07 | Public | giữ nguyên |
| GET | `/products/{id}` | Chi tiết sản phẩm | Public | giữ nguyên |
| POST | `/products` | Thêm sản phẩm | ADMIN | bỏ `?role=ADMIN` |
| PUT | `/products/{id}` | Sửa sản phẩm | ADMIN | bỏ `?role=ADMIN` |
| DELETE | `/products/{id}` | Xoá sản phẩm | ADMIN | bỏ `?role=ADMIN` |
| GET | `/products/category/{categoryId}` | Lọc theo danh mục | Public | giữ nguyên |
| POST | `/products/category/{categoryId}` | Thêm sản phẩm vào một danh mục | ADMIN | bỏ `?role=ADMIN` |
| POST | `/products/upload` | Lưu ảnh độc lập, trả chuỗi `uploads/<uuid>_<tên>` | ADMIN | bỏ `?role=ADMIN` |
| PUT | `/products/{id}/image` | Thay ảnh của sản phẩm | ADMIN | bỏ `?role=ADMIN` |
| POST | `/products/{id}/upload-image` | Upload ảnh, trả về sản phẩm đã cập nhật | ADMIN | giữ nguyên |
| GET | `/categories` | Danh sách danh mục | Public | giữ nguyên |
| GET | `/categories/{id}` | Chi tiết danh mục | Public | giữ nguyên |
| POST | `/categories` | Thêm danh mục | ADMIN | bỏ `?role=ADMIN` |
| PUT | `/categories/{id}` | Sửa danh mục | ADMIN | bỏ `?role=ADMIN` |
| DELETE | `/categories/{id}` | Xoá danh mục | ADMIN | bỏ `?role=ADMIN` |
| GET | `/categories/{id}/products` | Sản phẩm trong danh mục | Public | giữ nguyên |
| POST | `/categories/{id}/products` | Thêm sản phẩm vào danh mục — trùng chức năng với `POST /products/category/{id}` | ADMIN | bỏ `?role=ADMIN` |

Năm dòng `/products/search`, `POST /products/category/{id}`, `POST /products/upload`,
`PUT /products/{id}/image` và `POST /categories/{id}/products` được **giữ lại để tương thích
với bài thực hành SOS07/SOS09**; giao diện không gọi tới. Frontend chỉ dùng
`POST /products/{id}/upload-image` để tải ảnh.

**Thay đổi lớn nhất:** `?role=ADMIN` biến mất hoàn toàn. Role nay lấy từ JWT đã xác thực
chữ ký, không phải từ tham số do client tự khai. Đây là điểm khác biệt cốt lõi giữa bản
thực hành và bản đồ án.

Ảnh sản phẩm được đọc công khai qua Gateway: `GET /uploads/seed/**` lấy từ
`classpath:/static/uploads/seed/`; các ảnh upload runtime ở `/uploads/**` lấy từ đĩa.
`WebConfig` phải khai riêng đường dẫn seed vì handler `/uploads/**` trên đĩa che
đường dẫn static mặc định của Spring.

### API nội bộ (không lộ qua Gateway)

| Method | Endpoint | Mô tả |
|---|---|---|
| PATCH | `/internal/products/{id}/reserve-stock` | Kiểm tra còn hàng, trừ `stockQuantity` — có `@Transactional` |
| PATCH | `/internal/products/{id}/release-stock` | Hoàn trả tồn kho khi huỷ đơn |

Chỉ `order-service` gọi hai endpoint này, gọi thẳng `localhost:8082`.

## order-service — cổng 8083, tiền tố: `/api/orders`

| Method | Endpoint nội bộ | Mô tả | Yêu cầu | Từ monolith |
|---|---|---|---|---|
| POST | `/orders` | Đặt hàng — gọi ngầm `reserve-stock` từng dòng | CUSTOMER | giữ nguyên |
| GET | `/orders/my` | Đơn hàng của chính tôi | CUSTOMER | *(mới)* |
| GET | `/orders/{id}` | Chi tiết đơn | Chủ đơn hoặc ADMIN | giữ nguyên |
| GET | `/orders` | Toàn bộ đơn hàng | ADMIN | giữ nguyên |
| GET | `/orders/overview` | Doanh thu, biểu đồ theo ngày, top bán chạy — `from` + `to`, mặc định 30 ngày gần nhất | ADMIN | *(mới, xem ghi chú cuối file)* |
| PUT | `/orders/{id}/status` | Đổi trạng thái đơn | ADMIN | giữ nguyên |
| DELETE | `/orders/{id}` | Huỷ đơn — gọi ngầm `release-stock` | Chủ đơn hoặc ADMIN | *(mới)* |

`userId` của đơn luôn lấy từ JWT, không nhận từ body. `GET /orders/{id}` kiểm tra người
gọi đúng là chủ đơn — nếu không sẽ là IDOR: khách A đọc được đơn của khách B chỉ bằng
cách đổi số trên URL.

## Route dành cho đối tác ngoài

| Method | Endpoint qua Gateway | Forward tới | Xác thực |
|---|---|---|---|
| GET | `/api/public/products` | `product-service` `/products` | `X-API-KEY`, scope `products:read` |

Khoá **không còn** là chuỗi tĩnh trong `application.yml`. `auth-service` giữ bảng
`api_keys` (chủ sở hữu, scope, trạng thái, hạn dùng); Gateway hỏi sang
`/internal/api-keys/validate` rồi nhớ kết quả trong `partner.cache-ttl-seconds` giây
(mặc định 60 — thu hồi có độ trễ tương ứng; đặt `PARTNER_KEY_CACHE_TTL=0` để tắt cache).

Mã trạng thái phía đối tác: **401** thiếu header, **403** khoá sai / đã thu hồi / hết hạn
/ thiếu scope, **503** khi chưa hỏi được `auth-service` — không bao giờ cho qua khi chưa
kiểm tra được.

Sau khi kiểm tra xong, Gateway gắn `X-Partner-Name` cho service phía sau và **luôn xoá**
header này khỏi request của client trên mọi route, để không ai tự khai danh tính đối tác.

Khoá gốc chỉ tồn tại trong response của lệnh cấp khoá; CSDL chỉ giữ SHA-256 của nó.

## Endpoint của monolith bị bỏ

| Endpoint cũ | Lý do |
|---|---|
| `/hello/**` | Endpoint làm quen của bài thực hành SOS01, không thuộc nghiệp vụ |
| `POST /api2025/users` | Trùng chức năng với `/auth/register`, gộp lại |
| `GET /api2025/admin/overview` | Cần dữ liệu từ cả 3 service — xem ghi chú bên dưới |

### Ghi chú về trang tổng quan Admin

`GET /api2025/admin/overview` của monolith đếm sản phẩm, đơn hàng và doanh thu bằng một
câu truy vấn trên cùng một DB. Sau khi tách, dữ liệu nằm ở ba DB khác nhau nên không làm
như vậy được nữa. Hai cách:

1. **Frontend tự ghép** — gọi song song từng service rồi cộng lại. Đơn giản, không phải sửa backend.
2. **Backend tổng hợp** — tạo endpoint ở Gateway hoặc một service riêng đứng ra gọi cả ba.

Đồ án dùng **cách lai**, chia theo đúng ranh giới sở hữu dữ liệu:

- Phần nào **order-service tự tính được** thì để nó tính: doanh thu, biểu đồ theo ngày và top
  bán chạy đều chỉ cần bảng `orders` / `order_items`, nên có endpoint riêng
  `GET /orders/overview` (`OrderOverviewService`). Gộp ở đây tránh cho frontend phải tải về
  toàn bộ đơn hàng rồi tự cộng.
- Ba con số **tổng sản phẩm / tổng danh mục / tổng khách hàng** thì không: chúng thuộc CSDL mà
  order-service không được phép đọc. Frontend lấy riêng và ghép lại trong `getAdminOverview`
  (`admin-frontend/src/lib/api.ts`), gọi song song `/api/orders/overview`,
  `/api/products?page=0&size=1` (lấy `totalElements`), `/api/categories` và `/api/users`.

Tức trang Tổng quan ghép từ **4 nguồn**. Không chọn cách 2 thuần tuý vì như vậy phải dựng thêm
một service tổng hợp chỉ để đếm ba con số — không đáng với phạm vi đồ án.

## Quy ước mã trạng thái dùng chung

| Mã | Khi nào |
|---|---|
| 200 | Lấy / sửa thành công |
| 201 | Tạo mới thành công |
| 204 | Xoá thành công, không có body |
| 400 | Lỗi validation đầu vào |
| 401 | Chưa xác thực: thiếu token, token hỏng hoặc hết hạn |
| 403 | Đã xác thực nhưng không đủ quyền (sai role, sai scope) |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột nghiệp vụ: hết hàng, không gọi được service phụ thuộc |

**Bắt buộc khai `authenticationEntryPoint`.** Mặc định Spring Security trả **403** cho cả
trường hợp thiếu token, vì khi không khai gì nó dùng `Http403ForbiddenEntryPoint`. Như vậy
sai với bảng trên và làm hỏng cơ chế tự đăng xuất khi hết phiên ở frontend. Mỗi
`SecurityConfig` phải có:

```java
.exceptionHandling(ex -> ex.authenticationEntryPoint(
        (req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
```

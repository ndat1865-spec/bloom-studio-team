# Thiết kế biên giới Service — Bloom Studio

> Đồ án: **Thiết kế và phát triển nền tảng thương mại điện tử bán hoa theo kiến trúc
> hướng dịch vụ dựa trên RESTful API.**
>
> Tài liệu này chốt ranh giới giữa các service. Đây là bước quan trọng nhất: sai biên giới
> từ đầu sẽ kéo theo sửa chữa tốn kém ở các giai đoạn sau.

## 1. Danh sách Service

| Service | Cổng | Database | Trách nhiệm chính |
|---|---|---|---|
| `api-gateway` | 8080 | (không có DB) | Điểm vào duy nhất, định tuyến, chặn sớm, CORS |
| `auth-service` | 8081 | `bloom_auth` | User, đăng ký/đăng nhập, sinh và ký JWT, quản lý API Key |
| `product-service` | 8082 | `bloom_product` | Category, Product, tìm kiếm/lọc/phân trang, upload ảnh, tồn kho |
| `order-service` | 8083 | `bloom_order` | Giỏ hàng, đặt hàng, trạng thái đơn, gọi sang product-service trừ tồn kho |
| `customer-frontend` | 5173 | — | React + Vite, giao diện khách hàng, chỉ nói chuyện với Gateway |
| `admin-frontend` | 5174 | — | React + Vite, giao diện quản trị (chỉ nhận ADMIN), chỉ nói chuyện với Gateway |

Mỗi thư mục con là một project Spring Boot độc lập, mở bằng một cửa sổ IntelliJ riêng.

Kiểm thử frontend ngày 15/09/2026 xác nhận hai trách nhiệm tại service sở hữu:
auth-service chuyển lỗi thông tin đăng nhập thành HTTP 401; product-service phục vụ
ảnh seed từ classpath qua `/uploads/seed/**`. Gateway giữ nguyên vai trò định tuyến,
frontend đọc cả API lẫn ảnh sản phẩm qua cổng 8080.

## 2. Vì sao chia như vậy

Ranh giới được cắt theo **năng lực nghiệp vụ**, không theo tầng kỹ thuật:

- **Danh tính** (ai đang mua) thay đổi vì lý do khác hẳn **danh mục hàng** (bán gì) và
  **đơn hàng** (đã mua gì). Ba nhóm này có nhịp thay đổi và người phụ trách khác nhau.
- `Category` và `Product` **luôn đi cùng nhau** — không tách, vì mọi thao tác với sản phẩm
  đều cần danh mục, tách ra sẽ sinh lời gọi mạng cho một quan hệ 1-N tầm thường.
- `Order` và `OrderItem` cũng luôn đi cùng nhau — `OrderItem` không có ý nghĩa độc lập
  ngoài đơn hàng chứa nó.

## 3. Nguyên tắc sở hữu dữ liệu (Data Ownership)

- Mỗi service có **database riêng**. Không service nào truy cập trực tiếp DB của service khác.
- Muốn lấy hoặc đổi dữ liệu của service khác → **phải gọi REST API**.

### Hai khoá ngoại bị cắt khi tách

| Trước (monolith) | Sau (microservices) |
|---|---|
| `Order.user` → `@ManyToOne User` | `Order.userId` kiểu `Long`, không khoá ngoại |
| `OrderItem.product` → `@ManyToOne Product` | `OrderItem.productId` kiểu `Long`, không khoá ngoại |

Việc cắt này **không làm mất dữ liệu hiển thị**, vì mô hình đã denormalize sẵn từ trước:

```java
// OrderItem đã lưu bản sao tại thời điểm đặt hàng
private String  productName;
private Double  unitPrice;
private Double  lineTotal;

// Order đã lưu bản sao thông tin người nhận
private String  customerName;
private String  phone;
private String  address;
```

Đây không phải giải pháp chữa cháy mà là **cách làm đúng**: giá hoa hôm nay đổi thì đơn
hàng tháng trước vẫn phải giữ nguyên giá cũ. Nếu `OrderItem` đọc giá qua khoá ngoại thì
mọi hoá đơn cũ sẽ tự động sai khi admin sửa giá.

### Hệ quả phải chấp nhận

- Không `JOIN` xuyên service, không ràng buộc toàn vẹn ở tầng DB giữa `order` và `product`.
- Tính nhất quán do tầng ứng dụng bảo đảm bằng lời gọi API và xử lý lỗi, không phải bằng
  transaction của MySQL.

## 4. Giao tiếp liên-service

Chỉ có **một** luồng gọi giữa các service nghiệp vụ:

```
order-service  ──PATCH /internal/products/{id}/reserve-stock──►  product-service
               ──PATCH /internal/products/{id}/release-stock──►
```

Khi khách đặt hàng, `order-service` **trừ tồn kho ở product-service trước**, chỉ khi
product-service xác nhận thành công mới lưu đơn. Làm ngược lại sẽ sinh ra đơn hàng cho
sản phẩm đã hết hàng.

`Product` được **bổ sung trường `stockQuantity`** khi tách — mô hình monolith cũ chưa có.
Hoa tươi mỗi ngày có số lượng nhất định nên trường này hợp lý về nghiệp vụ, đồng thời là
chỗ thể hiện giao dịch phân tán của đồ án.

### Giới hạn đã biết

Đây **không phải** giao dịch phân tán thật (không Saga, không Outbox). Nếu `order-service`
chết ngay sau khi `reserve-stock` thành công nhưng trước khi lưu đơn, tồn kho sẽ bị trừ dư
mà không có đơn tương ứng. Với quy mô đồ án, rủi ro này được ghi nhận và chấp nhận; hướng
xử lý thật là Saga pattern hoặc bù trừ định kỳ.

## 5. Bảng định tuyến Gateway

| Route ngoài | Forward tới | Xác thực |
|---|---|---|
| `/api/auth/**` | `:8081` | `/login`, `/register` public; còn lại cần JWT |
| `/api/products/**` | `:8082` | GET public; POST/PUT/DELETE cần ROLE_ADMIN |
| `/api/categories/**` | `:8082` | GET public; còn lại ROLE_ADMIN |
| `/api/orders/**` | `:8083` | Cần JWT (CUSTOMER hoặc ADMIN) |
| `/api/public/products` | `:8082` | **API Key** — dành cho đối tác ngoài, không cần JWT |
| `/api/api-keys/**` | `:8081` | Cần JWT của ADMIN — quản trị khoá đối tác |
| `/uploads/**` | `:8082` | Public — ảnh sản phẩm, thẻ `<img>` không gửi được header |

### Route cố tình KHÔNG khai báo ở Gateway

`/internal/products/{id}/reserve-stock` và `/release-stock` không nằm trong bảng định
tuyến, nên frontend và đối tác ngoài không gọi tới được. Chỉ `order-service` gọi trực tiếp
`localhost:8082` qua mạng nội bộ.

**Giới hạn đã biết:** đây là bảo mật dựa trên *việc không định tuyến*, không phải xác thực
thật. Ai vào được mạng nội bộ vẫn gọi được. Hướng cải thiện: giới hạn IP nội bộ hoặc dùng
secret riêng giữa các service.

## 6. Hai lớp bảo mật độc lập

| Lớp | Dành cho | Cơ chế |
|---|---|---|
| JWT | Người dùng thật (ADMIN / CUSTOMER) | `Authorization: Bearer <token>` |
| API Key | Đối tác ngoài, máy gọi máy | Header `X-API-KEY` |

### Khoá đối tác thuộc về ai

Cả hai lớp đều là **định danh**, nên cùng một service sở hữu: `auth-service` giữ bảng
`api_keys` bên cạnh bảng `users`. Gateway không tự giữ danh sách khoá — nó hỏi sang
`/internal/api-keys/validate` rồi nhớ kết quả trong ít giây. Hệ quả:

- Thu hồi khoá là một lệnh `UPDATE` ở đúng một nơi, không phải sửa file cấu hình rồi
  khởi động lại Gateway.
- Gateway đứng được một mình cho phần định tuyến, nhưng route đối tác thì phụ thuộc
  `auth-service`. Khi `auth-service` chết, route đối tác trả **503** chứ không cho qua:
  lớp bảo mật nào "lỗi thì cho qua" thì coi như không có.
- Khoá gốc chỉ rời hệ thống đúng một lần, lúc cấp. CSDL chỉ giữ SHA-256 — xem ghi chú
  trên entity `ApiKey` về lý do không dùng BCrypt như mật khẩu.

Gateway chặn sớm để giảm tải, nhưng **từng service vẫn tự xác thực JWT độc lập**. Nếu ai
đó gọi thẳng `localhost:8082` bỏ qua Gateway thì bước kiểm tra ở Gateway hoàn toàn vô
hiệu — nguyên tắc Zero Trust thu nhỏ.

## 7. Phân công nhóm

| Thành phần | Phụ trách | Ghi chú |
|---|---|---|
| `auth-service` + `api-gateway` | Nguyễn Tiến Đạt | Phần mới hoàn toàn: JWT, BCrypt, routing, API Key, CORS |
| `product-service` | Hoàng Tuấn Anh | Chuyển từ monolith, nhiều code sẵn nhất |
| `order-service` | Lê Ngọc Bình Minh | Chuyển từ monolith + viết `ProductClient` |
| `customer-frontend` | Trần Thị Mỹ Ngân | Cửa hàng, giỏ hàng, đặt hàng, tài khoản — gọi Gateway + JWT |
| `admin-frontend` | Nguyễn Ngọc Minh Thu | Tổng quan, quản lý hoa, danh mục, đơn hàng, khoá API |

Quy ước chung, thống nhất từ đầu, không ai đổi một mình:

- Package gốc: `dh13c6.nguyentiendat516.bloom.<tenservice>`
- Format lỗi JSON: `{"message": "..."}` cho lỗi nghiệp vụ, `{"tenField": "loi"}` cho validation
- `jwt.secret` giống hệt nhau ở cả 3 service backend
- Mỗi phần việc một commit riêng, dạng `feat(<service>): <việc đã làm>`

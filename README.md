# Bloom Studio — Website bán hoa

Đồ án môn Phát triển phần mềm hướng dịch vụ: **Thiết kế và phát triển nền tảng thương mại
điện tử bán hoa theo kiến trúc hướng dịch vụ dựa trên RESTful API.**

Nhóm 5 thành viên. Hệ thống tách từ một bản monolith thành 4 dịch vụ backend và 2 giao diện.
Mỗi thành viên phát triển trên nhánh riêng và ghép vào `main` qua pull request.

## Thành viên và phân công

| Thành viên | Phụ trách | Thư mục | Cổng |
|---|---|---|---|
| Nguyễn Tiến Đạt (nhóm trưởng) | Xác thực, API Gateway, bảo mật, tích hợp, Docker | `auth-service/`, `api-gateway/`, `database/`, `docs/` | 8081, 8080 |
| Hoàng Tuấn Anh | Product Service | `product-service/` | 8082 |
| Lê Ngọc Bình Minh | Order Service | `order-service/` | 8083 |
| Trần Thị Mỹ Ngân | Giao diện khách hàng | `customer-frontend/` | 5173 |
| Nguyễn Ngọc Minh Thu | Giao diện quản trị | `admin-frontend/` | 5174 |

Mỗi thư mục có `README.md` riêng: phần đó làm gì, chạy thế nào, file nào quan trọng.

## Kiến trúc

```
   customer-frontend :5173 ─┐
                            ├──►┌──────────────┐
   admin-frontend    :5174 ─┘   │ api-gateway  │ :8080   điểm vào duy nhất
                                └──────┬───────┘
                                       │
          ┌────────────────────────────┼────────────────────┐
          ▼                            ▼                    ▼
   ┌─────────────┐             ┌───────────────┐    ┌─────────────┐
   │auth-service │             │product-service│    │order-service│
   │   :8081     │             │    :8082      │    │    :8083    │
   │ bloom_auth  │             │ bloom_product │    │ bloom_order │
   └─────────────┘             └──────▲────────┘    └──────┬──────┘
                                      └────────────────────┘
                          PATCH /internal/products/{id}/reserve-stock
```

- Mỗi service một CSDL riêng, **không service nào đọc CSDL của service khác**.
- Hai frontend chỉ biết một địa chỉ: Gateway `localhost:8080`. CORS khai **duy nhất** ở Gateway.
- Chỉ có một luồng gọi giữa hai service nghiệp vụ: `order-service` → `product-service` để
  trừ / hoàn tồn kho.
- Hai lớp bảo mật: **JWT** cho người dùng, **API Key** cho đối tác (`/api/public/**`).

Chi tiết: [Ranh giới service](docs/thiet-ke-bien-gioi-service.md) ·
[Danh sách API](docs/blueprint-api.md) · [Hướng dẫn chạy](docs/huong-dan-chay.md) ·
[Chạy bằng IntelliJ](docs/huong-dan-chay-intellij.md)

## Cấu trúc

```
bloom-studio-team/
├── auth-service/        # Đạt — JWT, BCrypt, người dùng, API Key
├── api-gateway/         # Đạt — định tuyến, CORS, kiểm tra API Key
├── product-service/     # Tuấn Anh — hoa, danh mục, ảnh, tồn kho
├── order-service/       # Bình Minh — đặt hàng, trạng thái đơn, thống kê
├── customer-frontend/   # Ngân — cửa hàng, giỏ hàng, thanh toán, tài khoản
├── admin-frontend/      # Thu — tổng quan, quản lý hoa/danh mục/đơn/khoá API
├── database/            # Đạt — script chuyển dữ liệu từ bản monolith
├── docs/                # Thiết kế, API, hướng dẫn chạy, biên bản kiểm thử
├── docker-compose.yml   # Đạt — dựng 4 service + 3 MySQL
└── .env.example         # Mẫu biến môi trường cho Docker Compose
```

## Chuẩn bị

- **JDK 17**, `JAVA_HOME` trỏ đúng JDK 17 (không phải JDK 11). Mỗi service có Maven Wrapper,
  không cần cài Maven.
- **MySQL 8** đang chạy. Tạo ba CSDL một lần:

```sql
CREATE DATABASE bloom_auth    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE bloom_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE bloom_order   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- Biến môi trường **`DB_PASSWORD`** = mật khẩu root MySQL (User variables trong Windows).
  Mật khẩu không nằm trong file nào để không lọt lên Git. Đặt xong phải đóng hẳn
  terminal/IntelliJ rồi mở lại.
- **Node 24** cho hai frontend.

Bảng được tạo tự động khi service khởi động lần đầu. `product-service` tự nạp 20 sản phẩm
mẫu khi bảng còn rỗng; `auth-service` tự tạo tài khoản `admin` và `john`.

## Chạy

Thứ tự: `auth-service` → `product-service` → `order-service` → `api-gateway` → hai frontend.
Mỗi thành phần một terminal, bắt đầu từ thư mục gốc repo:

```bat
cd auth-service
.\mvnw.cmd spring-boot:run
```

Làm tương tự với `product-service`, `order-service`, `api-gateway`. Hai frontend:

```bat
cd customer-frontend
npm ci
npm run dev
```

```bat
cd admin-frontend
npm ci
npm run dev
```

Trên macOS/Linux dùng `./mvnw spring-boot:run` thay cho `.\mvnw.cmd spring-boot:run`.

| Mở | Để làm gì |
|---|---|
| http://localhost:5173 | Cửa hàng: xem hoa, giỏ hàng, đặt hàng, đơn của tôi |
| http://localhost:5174 | Quản trị: chỉ tài khoản ADMIN đăng nhập được |
| http://localhost:8080/api/products | Gọi thẳng API qua Gateway |

Hai frontend **không dùng chung phiên đăng nhập** (localStorage tách theo cổng).

Chạy bằng Docker thay vì cài MySQL: chép `.env.example` thành `.env`, sửa `DB_PASSWORD`, rồi
`docker compose up --build`. Chỉ cổng 8080 lộ ra; frontend vẫn chạy bằng `npm run dev`.
Chi tiết ở [hướng dẫn chạy](docs/huong-dan-chay.md) mục 9.

### Tài khoản thử

| Username | Mật khẩu | Quyền |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `john` | `john123` | CUSTOMER |

API Key đối tác demo: `bloom-partner-key-2026` (header `X-API-KEY`, route `/api/public/**`).

## Môi trường

JDK 17 · Spring Boot 4.1.1 · Spring Cloud 2025.1.3 · JJWT 0.12.6 · MySQL 8 · Node 24 ·
React 19 + Vite 6 + Tailwind 4

## Quy ước làm việc chung

- Cập nhật `main` trước khi tạo nhánh: `git switch main`, `git pull`.
- Tên nhánh theo chức năng: `feat/product-search`, `fix/auth-login`, `docs/readme`.
- Commit: `feat(<service>): ...`, `fix(<service>): ...`, `docs: ...` — tiếng Việt không dấu.
- Chỉ sửa thư mục mình phụ trách. Cần đổi API của người khác thì trao đổi trước và cập nhật
  `docs/blueprint-api.md`.
- Package Java: `dh13c6.nguyentiendat516.bloom.<tenservice>`. Không dùng Lombok. Comment
  trong code viết tiếng Việt không dấu.
- Mọi định danh lấy từ JWT, không bao giờ tin `userId`/`role` do client gửi.
- Không commit `target/`, `node_modules/`, `dist/`, `.env`, `.idea/`, thư mục `uploads/` lúc chạy.
- Biên dịch sạch chưa chắc chạy được: sửa xong phải khởi động thật và gọi thử API.
- Push nhánh, tạo pull request vào `main`, người khác xem rồi mới merge.

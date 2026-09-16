# Bloom Studio — Website bán hoa

Đồ án của nhóm 5 thành viên, phát triển theo kiến trúc microservices. Repository này tập hợp các phần việc của cả nhóm; mỗi thành viên phát triển trên nhánh riêng và ghép vào `main` qua pull request.

## Thành viên và phân công

| Thành viên | Phụ trách | Tình trạng trong repo |
|---|---|---|
| Nguyễn Tiến Đạt | Auth Service, API Gateway, bảo mật và tích hợp | Đã có khung Auth và Gateway |
| Hoàng Tuấn Anh | Product Service | Đã có khung Product Service |
| Lê Ngọc Bình Minh | Order Service |  Đã có khung Order Service |
| Trần Thị Mỹ Ngân | Giao diện khách hàng | Chưa có code trên `main` tại lần cập nhật tài liệu này |
| Nguyễn Ngọc Minh Thu | Giao diện quản trị | Chưa có code trên `main` tại lần cập nhật tài liệu này |

## Cấu trúc hiện tại

```text
bloom-studio-team/
├── auth-service/          # Xác thực — Nguyễn Tiến Đạt
├── api-gateway/           # Định tuyến API — Nguyễn Tiến Đạt
├── product-service/       # Sản phẩm — Hoàng Tuấn Anh
│   └── README.md          # Hướng dẫn riêng Product Service
├── 01-nguyen-tien-dat/    # Tài liệu Auth + Gateway còn giữ từ bộ starter
├── docs/                  # Tài liệu thiết kế và API
├── scripts/               # Công cụ hỗ trợ
└── README.md              # Giới thiệu chung của nhóm
```

## Chạy các service hiện có

Cài **JDK 17**, đặt `JAVA_HOME` trỏ vào thư mục JDK. Mỗi service có Maven Wrapper, không cần cài Maven riêng; lần chạy đầu cần Internet để tải thư viện. Bản khởi đầu dùng dữ liệu trong bộ nhớ, chưa cần MySQL hoặc Docker.

Mở **ba terminal riêng**, mỗi terminal bắt đầu ở thư mục gốc `bloom-studio-team`:

**Auth Service:**

```powershell
cd auth-service
.\mvnw.cmd spring-boot:run
```

**Product Service:**

```powershell
cd product-service
.\mvnw.cmd spring-boot:run
```

**API Gateway:**

```powershell
cd api-gateway
.\mvnw.cmd spring-boot:run
```

Trên macOS/Linux, dùng `sh mvnw spring-boot:run` thay cho `mvnw.cmd`.

| Service | Cổng mặc định | Kiểm tra |
|---|---|---|
| API Gateway | 18080 | http://localhost:18080/health |
| Auth Service | 18081 | http://localhost:18081/health |
| Product Service | 18082 | http://localhost:18082/health |

Qua Gateway: `GET http://localhost:18080/api/products` để xem sản phẩm; `POST http://localhost:18080/api/auth/login` với JSON `{"username":"demo","password":"bloom123"}` để thử đăng nhập.

## Tài liệu từng phần

- [Nguyễn Tiến Đạt — Auth và API Gateway](01-nguyen-tien-dat/README.md)
- [Hoàng Tuấn Anh — Product Service](product-service/README.md)
- [Thiết kế API](docs/blueprint-api.md)
- [Ranh giới giữa các service](docs/thiet-ke-bien-gioi-service.md)

## Trạng thái và giới hạn

Đây là bộ khởi đầu, chưa phải hệ thống hoàn chỉnh. Auth lưu tài khoản trong RAM; khởi động lại làm mất tài khoản mới và vô hiệu hóa token cũ. Product cung cấp dữ liệu mẫu và API đọc, chưa có CRUD hay lưu database.

Gateway đã cấu hình route cho Order, nhưng cần ghép và chạy Order Service để dùng phần đó. Script `scripts/smoke-test.mjs` yêu cầu đủ cả bốn backend, nên chưa thể chạy đạt toàn bộ với ba service hiện có.

## Quy ước làm việc chung

1. Cập nhật `main` trước khi tạo nhánh cho phần việc mới.
2. Đặt tên nhánh theo chức năng, ví dụ `feat/product-search`, `fix/auth-login` hoặc `docs/project-readme`.
3. Code và README riêng đặt trong thư mục service tương ứng. README gốc dành cho giới thiệu, phân công và hướng dẫn chung của nhóm.
4. Chạy thử phần đã sửa; chỉ stage file liên quan, không đưa `target/`, `node_modules/` hay file môi trường vào Git.
5. Push nhánh, tạo pull request vào `main`; kiểm tra thay đổi trước khi merge.
6. Khi ghép thêm phần mới, cập nhật cấu trúc và tình trạng trong README chung.

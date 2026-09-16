# Bloom Studio — Bộ khởi đầu cho nhóm 5 người

**Giai đoạn 1: mỗi người có code chạy được và phần riêng để commit.**
Bộ này được tạo riêng từ đầu cho mốc cơ bản, không chứa toàn bộ tính năng của bản hoàn chỉnh ở thư mục cha.
Không có lịch sử Git hay commit mang tên người khác được tạo sẵn.

**Trạng thái repo ở commit khởi đầu:** chỉ có phần `01-nguyen-tien-dat` và tài liệu/script dùng chung.
Bốn thành viên còn lại sẽ bổ sung thư mục của mình bằng pull request.
Hướng dẫn chạy toàn nhóm và smoke test bên dưới dùng sau khi đã ghép đủ các phần.

## 1. Chia việc

| Người | Thư mục | Phần | Cổng |
|---|---|---|---|
| Nguyễn Tiến Đạt (nhóm trưởng) | `01-nguyen-tien-dat` | Auth + Gateway, bảo mật và tích hợp về sau | 18081, 18080 |
| Hoàng Tuấn Anh | `02-hoang-tuan-anh` | Product Service | 18082 |
| Lê Ngọc Bình Minh | `03-le-ngoc-binh-minh` | Order Service | 18083 |
| Trần Thị Mỹ Ngân | `04-tran-thi-my-ngan` | Giao diện khách hàng | 15173 |
| Nguyễn Ngọc Minh Thu | `05-nguyen-ngoc-minh-thu` | Giao diện quản trị | 15174 |

Mỗi thư mục có README riêng với cách chạy và lệnh commit.
Đạt phụ trách phần khó nhất: xác thực, Gateway và nối các service; bước đầu đã có BCrypt/JWT.
Frontend được tách thành **2 ứng dụng độc lập** để hai bạn đều tự chạy được; đây không phải 2 service nghiệp vụ mới.

## 2. Chạy riêng từng phần

- Java: **JDK 17**, JAVA_HOME đúng; chạy `mvnw.cmd spring-boot:run` trong service.
- Frontend: **Node >= 22.12**, khuyến nghị Node 24; `npm ci`, `npm run dev`.
- macOS/Linux: dùng `sh mvnw spring-boot:run` thay cho `mvnw.cmd`.
- Lần đầu cần Internet tải thư viện.
- **Không cần MySQL/Docker**, không cần mật khẩu DB.
- Các backend chỉ lắng nghe loopback (máy đang chạy).
- Backend nào cũng có `GET /health`, chạy riêng không cần service khác.
- Hai frontend mặc định **Demo**, có dữ liệu ngay cả khi backend chưa chạy.
- Order cần Product chỉ khi dùng chức năng tính giá.
- Dữ liệu nằm trong bộ nhớ; tài khoản mới mất sau khi khởi động lại.

## 3. Chạy ghép cả nhóm

Mở 6 terminal tại thư mục bộ khởi đầu, chạy lần lượt:

```bat
cd 01-nguyen-tien-dat\auth-service
.\mvnw.cmd spring-boot:run
```

```bat
cd 02-hoang-tuan-anh\product-service
.\mvnw.cmd spring-boot:run
```

```bat
cd 03-le-ngoc-binh-minh\order-service
.\mvnw.cmd spring-boot:run
```

```bat
cd 01-nguyen-tien-dat\api-gateway
.\mvnw.cmd spring-boot:run
```

```bat
cd 04-tran-thi-my-ngan\customer-frontend
npm ci
npm run dev
```

```bat
cd 05-nguyen-ngoc-minh-thu\admin-frontend
npm ci
npm run dev
```

Mở http://localhost:15173 và http://localhost:15174.
Ở mỗi trang chọn **Nguồn dữ liệu → API** để kiểm tra tích hợp.
Tài khoản thử: `demo` / `bloom123`, quyền CUSTOMER.
Cổng starter khác bản hoàn chỉnh (8080–8083, 5173), nên có thể chạy song song.

## 4. Có gì ở mốc cơ bản

- Auth đăng ký/đăng nhập thật trong RAM, băm mật khẩu, ký/xác thực JWT.
- Gateway chuyển tiếp API và cấu hình CORS cho đúng hai frontend.
- Product đọc/tìm 3 sản phẩm, 3 danh mục mẫu.
- Order cung cấp đơn minh họa và tính giá qua REST từ Product; **chưa tạo đơn**.
- Hai giao diện có dữ liệu demo, tìm kiếm, trạng thái lỗi; chuyển được sang API.
- Chưa có MySQL, CRUD quản trị, giữ tồn kho, API Key, thanh toán hoặc lưu phiên đăng nhập.
- Chưa có cơ chế xác thực chung giữa các service; chỉ Auth kiểm tra JWT cho `/auth/me`.
- Khóa JWT sinh ngẫu nhiên khi Auth khởi động; không có khóa bí mật đưa vào Git.

Chi tiết: [API](docs/blueprint-api.md) · [Ranh giới](docs/thiet-ke-bien-gioi-service.md).

## 5. Cách 5 bạn đưa code lên GitHub

1. **Đạt tạo repo chung rỗng** trên GitHub (không tự tạo README/.gitignore), thêm 4 bạn.
2. Đạt tạo một thư mục làm việc mới và clone repo rỗng. **Không làm trong repo bản hoàn chỉnh.**
3. Đạt copy phần `01-nguyen-tien-dat`, README chung, .gitignore, `docs` và `scripts` vào repo, rồi commit đầu:

```bat
git add README.md .gitignore docs/ scripts/ 01-nguyen-tien-dat/
git commit -m "feat(auth-gateway): khoi tao bo khung nhom va xac thuc JWT"
git branch -M main
git push -u origin main
```

4. Bốn bạn còn lại clone repo chung sau khi Đạt push; mỗi người copy đúng thư mục của mình, dùng lệnh trong README cá nhân để tạo nhánh và pull request.
5. Đạt ghép pull request. Mỗi người `git switch main`, `git pull` để lấy các phần đã ghép.
6. Làm tiếp trên nhánh mới cho từng chức năng. Không ghi đè cả repo bằng ZIP, không sửa tác giả hay thời gian commit.

**ZIP cá nhân chỉ có code phần người đó; ZIP tổng để Đạt giữ và kiểm tra ghép nhóm.
Không cần commit file ZIP, thư mục build, node_modules hoặc bản hoàn chỉnh.**

## 6. Kiểm tra

Build Java: `mvnw.cmd -B -q package` trong từng service.
Build frontend: `npm run build` trong từng frontend.
Sau khi chạy cả 4 backend, chạy tại gốc bộ khởi đầu:

```bat
node scripts/smoke-test.mjs
```

Bài smoke kiểm tra HTTP thật, bao gồm JWT, route, tính giá, tồn kho và CORS.
Báo cáo kết quả của lượt chuẩn bị được lưu ở `docs/kiem-tra.md`.

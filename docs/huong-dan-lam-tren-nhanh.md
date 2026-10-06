# Hướng dẫn làm việc trên nhánh riêng

Repo có `main` và 5 nhánh mang tên từng thành viên. Mỗi người **chỉ làm trên nhánh của mình**,
xong thì mở pull request vào `main`.

| Thành viên | Nhánh | Thư mục được sửa |
|---|---|---|
| Nguyễn Tiến Đạt | `nguyen-tien-dat` | `payment-service/`, `notification-service/`, `chat-service/`, `database/`, `docs/`, `docker-compose.yml`, `README.md` |
| Hoàng Tuấn Anh | `hoang-tuan-anh` | `product-service/` |
| Lê Ngọc Bình Minh | `le-ngoc-binh-minh` | `order-service/` |
| Trần Thị Mỹ Ngân | `tran-thi-my-ngan` | `auth-service/`, `customer-frontend/` |
| Nguyễn Ngọc Minh Thu | `nguyen-ngoc-minh-thu` | `api-gateway/`, `admin-frontend/` |

Nhánh nào cũng chứa **toàn bộ project** — đó là cách Git hoạt động, và cả nhóm đều cần đủ các
service để chạy thử. Phần việc của từng người thể hiện ở các commit và pull request do chính tài
khoản GitHub của người đó tạo.

## 1. Lấy nhánh của mình (làm một lần)

Chưa có repo trên máy thì clone trước:

```bash
git clone https://github.com/ndat1865-spec/bloom-studio-team.git
cd bloom-studio-team
```

Rồi chuyển sang nhánh của mình và lấy code mới nhất của cả nhóm (thay `ten-nhanh` bằng tên ở
bảng trên, ví dụ `tran-thi-my-ngan`):

```bash
git fetch origin --prune
git switch ten-nhanh
git merge origin/main
```

Các nhánh cũ dạng `feat/...`, `docs/...` đã xoá. `--prune` dọn chúng khỏi máy; đừng làm tiếp
trên các nhánh đó.

## 2. Mỗi lần làm việc

1. Kiểm tra đang đứng đúng nhánh: `git branch` — dòng có dấu `*` phải là tên mình.
2. Lấy thay đổi mới của cả nhóm:

   ```bash
   git fetch origin
   git merge origin/main
   ```

3. Sửa code, **chỉ trong thư mục của mình**.
4. Khởi động thật và gọi thử API (Postman: `docs/postman/`) — biên dịch sạch chưa chắc đã chạy.
5. Lưu và đẩy lên:

   ```bash
   git add ten-thu-muc/
   git commit -m "feat(ten-thu-muc): viec da lam, tieng Viet khong dau"
   git push
   ```

Mẫu commit:

| Loại | Ví dụ |
|---|---|
| Tính năng | `feat(auth-service): them kiem tra do dai mat khau` |
| Sửa lỗi | `fix(customer-frontend): sua nut dat hang bi an tren dien thoai` |
| Tài liệu | `docs: cap nhat huong dan chay` |

## 3. Mở pull request

1. Vào https://github.com/ndat1865-spec/bloom-studio-team.
2. Bấm **Compare & pull request** (hiện ngay sau khi push), hoặc tab **Pull requests → New pull
   request**, chọn `base: main` ← `compare: <nhánh của mình>`.
3. Xem tab **Files changed**: chỉ được có thư mục của mình. Thấy file của người khác thì nhắn
   nhóm trước khi tạo.
4. Bấm **Create pull request**. Nhóm trưởng xem rồi merge.
5. Sau khi merge, quay lại bước 2 cho lần làm tiếp theo — nhánh của mình vẫn giữ nguyên, không
   tạo nhánh mới.

## Lưu ý

- Push bằng **tài khoản GitHub của chính mình** để tên mình hiện trên commit. Kiểm tra bằng
  `git config user.name` và `git config user.email`.
- Không commit `.env`, `node_modules/`, `target/`, `dist/`, `.idea/`, thư mục `uploads/` lúc chạy.
- Cần đổi chỗ dùng chung (hàm gọi API của frontend, API của service khác) thì báo nhóm trước và
  cập nhật `docs/blueprint-api.md`.
- `git merge origin/main` báo xung đột: xung đột trong thư mục của mình thì tự sửa; trong thư
  mục người khác thì giữ bản của `main` và báo người đó.
- Git báo `Filename too long`: chạy `git config --global core.longpaths true` rồi làm lại.
